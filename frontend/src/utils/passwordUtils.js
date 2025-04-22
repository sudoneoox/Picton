/**
 * Password generation utility functions
 */

/**
 * Generates a temporary password that meets security requirements:
 * - At least 8 characters
 * - Contains uppercase and lowercase letters
 * - Contains numbers
 * - Contains special characters
 */
export function generateTemporaryPassword() {
    const length = 12;
    const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O to avoid confusion
    const lowercaseChars = 'abcdefghijkmnpqrstuvwxyz'; // Excluding l and o to avoid confusion
    const numberChars = '23456789'; // Excluding 0 and 1 to avoid confusion
    const specialChars = '@#$%^&*';
    
    // Ensure at least one of each type
    let password = '';
    password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    password += numberChars[Math.floor(Math.random() * numberChars.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill the rest with random characters from all sets
    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
} 