export class NotabugHelpers {
  static chaosClass(level) {
    if (level >= 80) return 'high';
    if (level >= 50) return 'medium';
    return 'low';
  }

  static chaosBodyClass(level) {
    if (level >= 90) return 'chaos-critical';
    if (level >= 70) return 'chaos-high';
    return '';
  }

  static sanitizeClass(sanity) {
    if (sanity >= 50) return 'sanity-100';
    if (sanity >= 30) return 'sanity-50';
    if (sanity >= 10) return 'sanity-30';
    return 'sanity-10';
  }

  static sanitizeEffect(sanity) {
    if (sanity >= 50) return 'Normal operations';
    if (sanity >= 30) return 'Minor visual glitches detected';
    if (sanity >= 10) return 'Fake bugs may appear';
    return 'REALITY UNRELIABLE';
  }

  static formatBug(bug) {
    return {
      ...bug,
      severityClass: 'severity-' + bug.severity,
      statusClass: 'status-' + bug.status,
      chaosClass: NotabugHelpers.chaosClass(bug.chaos_level),
      isCritical: bug.severity === 'critical',
      bountyFormatted: bug.bounty ? '$' + bug.bounty : '—'
    };
  }

  static validateUsername(username) {
    if (!username || typeof username !== 'string') return false;
    if (username.length < 3 || username.length > 30) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return false;
    return true;
  }

  static validatePassword(password) {
    if (!password || typeof password !== 'string') return false;
    if (password.length < 6 || password.length > 100) return false;
    return true;
  }

  static buildBaseContext(stats) {
    return {
      chaosLevel: stats.chaosLevel,
      activeHunters: stats.activeHunters,
      globalSanity: stats.globalSanity,
      globalChaosClass: NotabugHelpers.chaosClass(stats.chaosLevel),
      chaosBodyClass: NotabugHelpers.chaosBodyClass(stats.chaosLevel),
      layout: 'layout'
    };
  }

  static SEVERITY_CHANCES = { low: 0.8, medium: 0.55, high: 0.35, critical: 0.15 };

  static RANDOM_BUG_TITLES = [
    'Undefined behavior in production',
    'Race condition at midnight',
    'Null pointer in critical path',
    'Memory leak detected somewhere',
    'Segfault on valid input',
    'Infinite loop that sometimes stops',
    'Heisenbug: disappears when debugging',
    'Type coercion anomaly',
    'Off-by-one in core logic',
    'Silent data corruption'
  ];

  static RANDOM_SEVERITIES = ['low', 'low', 'medium', 'medium', 'high', 'critical'];

  static MAX_OPEN_BUGS = 100;
}
