# 🔐 Security Setup for Steen Dashboard

## ⚠️ Important Security Notice

This application requires sensitive credentials that should **NEVER** be committed to version control.

## 📋 Setup Instructions

### 1. Backend Configuration (PHP)

1. **Copy the template:**
   ```bash
   cp api/php/config.example.php api/php/config.php
   ```

2. **Edit `api/php/config.php` with your actual credentials:**
   ```php
   // Database configuration
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_actual_database_name');
   define('DB_USER', 'your_actual_database_user');
   define('DB_PASS', 'your_actual_database_password');
   
   // API Configuration
   define('API_KEY', 'generate_a_secure_64_character_key_here');
   ```

### 2. Frontend Configuration (Next.js)

1. **Create `.env.local`:**
   ```bash
   # API Configuration
   NEXT_PUBLIC_API_URL=https://yourdomain.com/api/php
   NEXT_PUBLIC_API_KEY=same_api_key_as_backend
   ```

### 3. Generate Secure API Key

Use one of these methods to generate a secure API key:

```bash
# Method 1: OpenSSL
openssl rand -hex 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 3: Online generator
# Visit: https://www.grc.com/passwords.htm
```

## 🛡️ Security Best Practices

### ✅ Do's:
- Keep credentials in environment variables
- Use strong, unique passwords
- Regularly rotate API keys
- Use HTTPS in production
- Set proper file permissions (644 for PHP files)

### ❌ Don'ts:
- Never commit `config.php` or `.env` files
- Don't use default or weak passwords  
- Don't expose credentials in error messages
- Don't use the same API key across environments

## 🚀 Deployment Checklist

### Before Deployment:
- [ ] `config.php` created with actual credentials
- [ ] `.env.local` configured
- [ ] API key is strong (64+ characters)
- [ ] Database credentials are correct
- [ ] CORS settings are appropriate for your domain
- [ ] Error display is disabled in production

### Production Security:
- [ ] Use environment variables on server
- [ ] Enable HTTPS/SSL
- [ ] Restrict CORS to your domain only
- [ ] Set secure file permissions
- [ ] Enable PHP error logging (not display)
- [ ] Regular backup of database

## 📁 File Structure

```
api/php/
├── config.example.php    ✅ Safe to commit (template)
├── config.php           ❌ Never commit (contains secrets)
├── .htaccess            ✅ Safe to commit
└── *.php                ✅ Safe to commit
```

## 🆘 If Credentials Are Compromised

1. **Immediately change:**
   - Database password
   - API key
   - Any other exposed credentials

2. **Update configuration files**
3. **Force push clean history** (if needed)
4. **Monitor for unauthorized access**

## 📞 Support

If you need help with setup:
1. Check that all files exist
2. Verify credentials are correct
3. Check server error logs
4. Ensure database is accessible

**Remember: Security is not optional!** 🔒