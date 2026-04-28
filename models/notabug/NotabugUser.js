export class NotabugUser {
  constructor({ username, password, confirmPassword, email }) {
    this.username = username;
    this.password = password;
    this.confirmPassword = confirmPassword;
    this.email = email || null;
  }

  validate() {
    this.validateUsername();
    this.validatePassword();
    this.validatePasswordMatch();
    this.validateEmail();
  }

  validateUsername() {
    if (!this.username || typeof this.username !== 'string') {
      throw new Error('Username is required');
    }
    if (this.username.length < 3 || this.username.length > 30) {
      throw new Error('Username must be 3-30 characters');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(this.username)) {
      throw new Error('Username must contain only alphanumeric characters, hyphens, and underscores');
    }
  }

  validatePassword() {
    if (!this.password || typeof this.password !== 'string') {
      throw new Error('Password is required');
    }
    if (this.password.length < 6 || this.password.length > 100) {
      throw new Error('Password must be 6-100 characters');
    }
  }

  validatePasswordMatch() {
    if (this.confirmPassword !== undefined && this.password !== this.confirmPassword) {
      throw new Error('Passwords do not match');
    }
  }

  validateEmail() {
    if (!this.email) return;
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(this.email)) {
      throw new Error('Invalid email format');
    }
    if (this.email.length > 255) {
      throw new Error('Email must not exceed 255 characters');
    }
  }

  toPublic() {
    return {
      username: this.username,
      email: this.email
    };
  }
}

export default NotabugUser;
