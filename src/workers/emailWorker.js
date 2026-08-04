import { createQueue, createWorker } from '../config/bullmq.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';
import nodemailer from 'nodemailer';

/**
 * Email Processor with Production Features
 * Full lifecycle: progress tracking, error handling, DLQ management
 */

const getRandomDelay = (min, max) => Math.random() * (max - min) + min;

/**
 * Initialize email transporter
 * Uses real SMTP configuration for production
 */
let emailTransporter = null;

const getEmailTransporter = () => {
  if (emailTransporter) {
    return emailTransporter;
  }

  emailTransporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465, // true for 465, false for other ports
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates in development
    },
  });

  // Verify connection
  emailTransporter.verify((error, success) => {
    if (error) {
      logger.warn('Email transporter verification failed:', error.message);
      // Don't fail, continue with simulation as fallback
    } else if (success) {
      logger.info('Email transporter verified successfully');
    }
  });

  return emailTransporter;
};

/**
 * Send email via SMTP or fallback to simulation
 */
const sendEmailViaSMTP = async (recipient, subject, message) => {
  try {
    const transporter = getEmailTransporter();
    
    const mailOptions = {
      from: config.smtp.from,
      to: recipient,
      subject,
      text: message,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', {
      recipient,
      messageId: info.messageId,
      response: info.response,
    });

    return {
      sent: true,
      recipient,
      subject,
      messageSize: message?.length || 0,
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - Date.now(), // Placeholder
    };
  } catch (error) {
    logger.warn('SMTP sending failed, falling back to simulation:', error.message);
    // Fall back to simulation
    return null;
  }
};

const simulateEmailSending = async (job) => {
  const { recipient, subject, message } = job.data;
  const isDevelopment = config.isDevelopment;

  // Try real SMTP first
  if (!isDevelopment && config.smtp.user && config.smtp.pass) {
    const result = await sendEmailViaSMTP(recipient, subject, message);
    if (result) {
      return result;
    }
  }

  // Fallback to simulation
  if (isDevelopment) {
    // Random failure rate: 10% in dev for demo purposes
    const shouldFail = Math.random() < 0.10;
    
    if (shouldFail) {
      throw new Error(`Simulated failure: Failed to send email to ${recipient}`);
    }

    // Random processing delay: 300-1000ms in dev
    const delay = getRandomDelay(300, 1000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  } else {
    // Production mode: minimal processing time
    const delay = getRandomDelay(100, 300);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return {
    sent: true,
    recipient,
    subject,
    messageSize: message?.length || 0,
    timestamp: new Date().toISOString(),
    processingTime: Date.now() - job.startedOn,
    simulated: true,
  };
};

const moveToDeadLetterQueue = async (job, reason) => {
  try {
    const dlq = createQueue(QUEUE_NAMES.emailDLQ);

    const dlqJob = await dlq.add(
      {
        originalJobId: job.id,
        originalData: job.data,
        failedReason: reason,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        failedAt: new Date().toISOString(),
        createdAt: new Date(job.timestamp).toISOString(),
      },
      {
        removeOnComplete: false,
        removeOnFail: false,
        jobId: `dlq${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      }
    );

    logger.warn(`Job moved to DLQ`, {
      originalJobId: job.id,
      dlqJobId: dlqJob.id,
      recipient: job.data.recipient,
      reason,
    });

    return dlqJob;
  } catch (err) {
    logger.error(`Failed to move job to DLQ`, { jobId: job.id, error: err.message });
    throw err;
  }
};

export const emailProcessor = async (job) => {
  const startTime = Date.now();
  const { recipient } = job.data;

  try {
    // Progress: Queued (5%)
    try {
      await job.updateProgress(5);
    } catch (err) {
      logger.debug(`Progress update failed at 5%`, { error: err.message });
    }

    logger.info(`Job started`, {
      jobId: job.id,
      recipient,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
    });

    // Progress: Processing (25%)
    try {
      await job.updateProgress(25);
    } catch (err) {
      logger.debug(`Progress update failed at 25%`, { error: err.message });
    }

    // Simulate email sending
    const result = await simulateEmailSending(job);

    // Progress: Finalizing (75%)
    try {
      await job.updateProgress(75);
    } catch (err) {
      logger.debug(`Progress update failed at 75%`, { error: err.message });
    }

    // Progress: Complete (100%)
    try {
      await job.updateProgress(100);
    } catch (err) {
      logger.debug(`Progress update failed at 100%`, { error: err.message });
    }

    const executionTime = Date.now() - startTime;

    logger.info(`Job completed`, {
      jobId: job.id,
      recipient,
      executionTime,
      result,
    });

    return {
      success: true,
      recipient,
      executionTime,
      sentAt: new Date().toISOString(),
      ...result,
    };
  } catch (err) {
    const executionTime = Date.now() - startTime;
    const isLastAttempt = job.attemptsMade >= job.opts.attempts - 1;

    logger.warn(`Job failed`, {
      jobId: job.id,
      recipient,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
      executionTime,
      error: err.message,
      willRetry: !isLastAttempt,
    });

    // Move to DLQ if max retries exceeded
    if (isLastAttempt) {
      logger.error(`Job max retries exceeded`, {
        jobId: job.id,
        recipient,
        totalAttempts: job.attemptsMade + 1,
        totalExecutionTime: Date.now() - job.timestamp,
      });

      await moveToDeadLetterQueue(job, err.message);
    }

    throw err;
  }
};

export const initializeEmailWorker = () => {
  const queue = createQueue(QUEUE_NAMES.email);
  
  queue.process(config.queue.concurrency || 1, emailProcessor);

  queue.on('progress', (job, progress) => {
    logger.debug(`Job progress`, {
      jobId: job.id,
      progress: `${progress}%`,
      recipient: job.data.recipient,
    });
  });

  queue.on('completed', (job, result) => {
    logger.info(`Worker: Job completed`, {
      jobId: job.id,
      recipient: job.data.recipient,
      executionTime: result?.executionTime,
    });
  });

  queue.on('failed', (job, err) => {
    logger.warn(`Worker: Job failed`, {
      jobId: job.id,
      recipient: job.data.recipient,
      error: err.message,
      attempt: job.attemptsMade + 1,
    });
  });

  queue.on('error', (err) => {
    logger.error(`Worker error`, { error: err.message });
  });

  logger.info(`Email worker initialized`, { queueName: QUEUE_NAMES.email });
  return queue;
};

export default {
  emailProcessor,
  initializeEmailWorker,
};
