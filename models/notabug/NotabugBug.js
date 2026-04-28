export class NotabugBug {
  constructor({ title, description, severity, bounty, steps_to_reproduce }) {
    this.title = title;
    this.description = description;
    this.severity = severity;
    this.bounty = bounty;
    this.steps_to_reproduce = steps_to_reproduce;
  }

  validate() {
    this.validateTitle();
    this.validateSeverity();
    this.validateBounty();
  }

  validateTitle() {
    if (!this.title || typeof this.title !== 'string' || this.title.trim().length === 0) {
      throw new Error('Bug title is required');
    }
    if (this.title.trim().length > 255) {
      throw new Error('Bug title must not exceed 255 characters');
    }
  }

  validateSeverity() {
    const valid = ['low', 'medium', 'high', 'critical'];
    if (!this.severity || !valid.includes(this.severity)) {
      this.severity = 'medium';
    }
  }

  validateBounty() {
    if (this.bounty === null || this.bounty === undefined || this.bounty === '') {
      this.bounty = null;
      return;
    }
    const parsed = parseInt(this.bounty, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 9999) {
      throw new Error('Bounty must be a number between 0 and 9999');
    }
    this.bounty = parsed;
  }

  toInsertParams() {
    return [
      this.title.trim(),
      this.description || 'No description provided.',
      this.severity,
      this.bounty,
      this.steps_to_reproduce || null
    ];
  }
}

export default NotabugBug;
