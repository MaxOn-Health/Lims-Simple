import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as os from 'os';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      loadAverage: number[];
    };
  };
}

@Injectable()
export class HealthService {
  constructor(private dataSource: DataSource) {}

  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbResponseTime: number | undefined;

    try {
      // Check database connection
      await this.dataSource.query('SELECT 1');
      dbStatus = 'connected';
      dbResponseTime = Date.now() - startTime;
    } catch (error) {
      dbStatus = 'disconnected';
    }

    // Get system information
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    return {
      status: dbStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      service: 'LIMS API',
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      system: {
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round(memoryPercentage * 100) / 100,
        },
        cpu: {
          loadAverage: os.loadavg(),
        },
      },
    };
  }
}



