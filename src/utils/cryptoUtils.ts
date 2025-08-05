// Utilitaires de hachage pour la sécurité des mots de passe et emails
// Utilise l'API Web Crypto native du navigateur

export class CryptoUtils {
  // Générer un salt aléatoire
  static generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Encoder une chaîne en bytes pour l'API Crypto
  static encodeString(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  // Convertir ArrayBuffer en string hexadécimale
  static bufferToHex(buffer: ArrayBuffer): string {
    const hexCodes = [];
    const view = new DataView(buffer);
    for (let i = 0; i < view.byteLength; i += 4) {
      const value = view.getUint32(i);
      const stringValue = value.toString(16);
      const padding = '00000000';
      const paddedValue = (padding + stringValue).slice(-padding.length);
      hexCodes.push(paddedValue);
    }
    return hexCodes.join('');
  }

  // Hacher un mot de passe avec salt
  static async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const usedSalt = salt || this.generateSalt();
    const data = this.encodeString(password + usedSalt);
    
    // Utiliser SHA-256 avec multiple itérations pour plus de sécurité
    let hash = await crypto.subtle.digest('SHA-256', data);
    
    // Effectuer plusieurs itérations pour ralentir les attaques par force brute
    for (let i = 0; i < 10000; i++) {
      const combined = new Uint8Array(hash.byteLength + data.byteLength);
      combined.set(new Uint8Array(hash), 0);
      combined.set(data, hash.byteLength);
      hash = await crypto.subtle.digest('SHA-256', combined);
    }
    
    return {
      hash: this.bufferToHex(hash),
      salt: usedSalt
    };
  }

  // Vérifier un mot de passe
  static async verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
    const { hash } = await this.hashPassword(password, salt);
    return hash === storedHash;
  }

  // Hacher un email (pour la confidentialité)
  static async hashEmail(email: string): Promise<string> {
    const data = this.encodeString(email.toLowerCase().trim());
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.bufferToHex(hash);
  }

  // Créer un identifiant unique basé sur l'email hashé (pour les recherches)
  static async createEmailIdentifier(email: string): Promise<string> {
    const hash = await this.hashEmail(email);
    // Prendre seulement les 16 premiers caractères pour un identifiant plus court
    return hash.substring(0, 16);
  }

  // Masquer partiellement un email pour l'affichage
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return email; // Email invalide
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : localPart;
    
    const [domainName, tld] = domain.split('.');
    const maskedDomain = domainName.length > 2
      ? domainName.substring(0, 2) + '*'.repeat(domainName.length - 2)
      : domainName;
    
    return `${maskedLocal}@${maskedDomain}.${tld}`;
  }

  // Valider la force d'un mot de passe
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Ajoutez des lettres minuscules');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Ajoutez des lettres majuscules');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Ajoutez des chiffres');
    }

    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Ajoutez des caractères spéciaux (!@#$%^&*...)');
    }

    if (password.length >= 12) {
      score += 1;
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  // Générer un mot de passe sécurisé
  static generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    const password = [];
    
    // Assurer qu'au moins un caractère de chaque type est présent
    password.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
    password.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
    password.push(numbers[Math.floor(Math.random() * numbers.length)]);
    password.push(symbols[Math.floor(Math.random() * symbols.length)]);
    
    // Compléter avec des caractères aléatoires
    for (let i = 4; i < length; i++) {
      password.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }
    
    // Mélanger le tableau
    for (let i = password.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [password[i], password[j]] = [password[j], password[i]];
    }
    
    return password.join('');
  }
}
