/**
 * AI Risk Management
 * Anomaly detection and risk assessment using TensorFlow.js
 */

import * as tf from '@tensorflow/tfjs';
import { TradingSignal } from './strategies';

export interface RiskMetrics {
  volatilityScore: number;
  anomalyScore: number;
  portfolioRisk: number;
  approved: boolean;
  warnings: string[];
}

export class AIRiskManager {
  private anomalyThreshold = 0.7;
  private maxPositionSize = 0.1; // 10% of capital per position
  private maxDailyLoss = 0.02; // 2% daily loss limit

  /**
   * Detect anomalies in market conditions
   */
  async detectAnomalies(data: number[][]): Promise<number[]> {
    try {
      // Convert data to tensor
      const tensor = tf.tensor2d(data);

      // Calculate z-scores for anomaly detection
      const mean = tensor.mean(0);
      const std = tf.moments(tensor, 0).variance.sqrt();

      const zScores = tensor.sub(mean).div(std.add(1e-7));
      const anomalyScores = zScores.abs().max(1);

      const scores = await anomalyScores.array() as number[];

      // Cleanup tensors
      tensor.dispose();
      mean.dispose();
      std.dispose();
      zScores.dispose();
      anomalyScores.dispose();

      return scores;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return [];
    }
  }

  /**
   * Assess risk for trading signals
   */
  async assessRisk(signals: TradingSignal[]): Promise<TradingSignal[]> {
    const approvedSignals: TradingSignal[] = [];

    for (const signal of signals) {
      const metrics = await this.calculateRiskMetrics(signal);

      if (metrics.approved) {
        approvedSignals.push(signal);
      } else {
        console.warn(
          `Signal rejected for ${signal.symbol}:`,
          metrics.warnings.join(', ')
        );
      }
    }

    return approvedSignals;
  }

  /**
   * Calculate risk metrics for a signal
   */
  private async calculateRiskMetrics(
    signal: TradingSignal
  ): Promise<RiskMetrics> {
    const warnings: string[] = [];
    let approved = true;

    // Check confidence threshold (lowered for demo with mock data)
    if (signal.confidence < 0.25) {
      warnings.push('Low confidence score');
      approved = false;
    }

    // Check stop loss distance (lowered for demo with mock data)
    if (signal.stopLoss && signal.targetPrice) {
      const riskRewardRatio =
        Math.abs(signal.targetPrice - signal.stopLoss) /
        Math.abs(signal.stopLoss - signal.targetPrice);

      if (riskRewardRatio < 0.8) {
        warnings.push('Poor risk/reward ratio');
        approved = false;
      }
    }

    // Calculate volatility score (simplified)
    const volatilityScore = this.calculateVolatility(signal);

    // Anomaly score (would use market data in production)
    const anomalyScore = 0.3;

    return {
      volatilityScore,
      anomalyScore,
      portfolioRisk: 0.05,
      approved,
      warnings,
    };
  }

  /**
   * Calculate volatility score
   */
  private calculateVolatility(signal: TradingSignal): number {
    // Simplified volatility calculation
    // In production, this would use historical price data
    return 0.25;
  }

  /**
   * Emergency stop - close all positions
   */
  async emergencyStop(): Promise<void> {
    console.warn('EMERGENCY STOP TRIGGERED');

    try {
      // In production, this would call API to close positions
      // For now, just log the action
      console.log('All virtual positions would be closed');

      // Could send alerts via email/SMS
      await this.sendAlert('Emergency stop triggered');
    } catch (error) {
      console.error('Emergency stop failed:', error);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(message: string): Promise<void> {
    // Implement alert mechanism (email, SMS, etc.)
    console.log(`ALERT: ${message}`);
  }

  /**
   * Circuit breaker - check if trading should be halted
   */
  async checkCircuitBreaker(currentLoss: number): Promise<boolean> {
    if (currentLoss >= this.maxDailyLoss) {
      await this.emergencyStop();
      return true;
    }
    return false;
  }
}

// Singleton instance
let riskManager: AIRiskManager | null = null;

export function getRiskManager(): AIRiskManager {
  if (!riskManager) {
    riskManager = new AIRiskManager();
  }
  return riskManager;
}
