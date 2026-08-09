'use strict';

const { computeRiskScore } = require('../src/services/riskScoringService');

describe('riskScoringService.computeRiskScore', () => {
  it('returns a low band score when there are no signals', () => {
    const result = computeRiskScore({ alerts: [], assets: [], threatIntelMatches: 0 });
    expect(result.score).toBeLessThan(40);
    expect(result.band).toBe('low');
  });

  it('escalates to critical when severity, correlation, and threat intel align', () => {
    const alerts = [
      { severity: 'critical', mitreTactic: 'exfiltration' },
      { severity: 'high', mitreTactic: 'command-and-control' },
      { severity: 'high', mitreTactic: 'collection' },
    ];
    const assets = [{ criticality: 'critical' }];
    const result = computeRiskScore({ alerts, assets, threatIntelMatches: 2 });

    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(['high', 'critical']).toContain(result.band);
    expect(result.rationale.length).toBeGreaterThan(0);
  });

  it('never exceeds the 0-100 bound', () => {
    const alerts = Array.from({ length: 10 }, () => ({ severity: 'critical', mitreTactic: 'impact' }));
    const assets = [{ criticality: 'critical' }];
    const result = computeRiskScore({ alerts, assets, threatIntelMatches: 10 });

    expect(result.score).toBeLessThanOrEqual(100);
  });
});
