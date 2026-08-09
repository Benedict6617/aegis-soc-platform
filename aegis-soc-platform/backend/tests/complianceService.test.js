'use strict';

const { FRAMEWORK_CONTROLS } = require('../src/services/complianceService');

describe('complianceService.FRAMEWORK_CONTROLS', () => {
  const frameworks = ['SOC2', 'ISO27001', 'PCI_DSS', 'NIST_CSF', 'HIPAA', 'GDPR'];

  it.each(frameworks)('defines at least one control for %s', (framework) => {
    expect(FRAMEWORK_CONTROLS[framework]).toBeDefined();
    expect(FRAMEWORK_CONTROLS[framework].length).toBeGreaterThan(0);
  });

  it('every control has a unique id within its framework and an evaluate function', () => {
    for (const framework of frameworks) {
      const controls = FRAMEWORK_CONTROLS[framework];
      const ids = controls.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
      controls.forEach((c) => expect(typeof c.evaluate).toBe('function'));
    }
  });
});
