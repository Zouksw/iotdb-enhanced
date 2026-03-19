import { gradients, glassmorphism, lightTheme, darkTheme } from '../theme';

describe('theme', () => {
  describe('gradients', () => {
    it('should have all required gradient properties', () => {
      expect(gradients).toHaveProperty('primary');
      expect(gradients).toHaveProperty('secondary');
      expect(gradients).toHaveProperty('success');
      expect(gradients).toHaveProperty('dark');
      expect(gradients).toHaveProperty('purple');
      expect(gradients).toHaveProperty('blue');
      expect(gradients).toHaveProperty('sunset');
      expect(gradients).toHaveProperty('midnight');
    });

    it('should have valid gradient strings', () => {
      expect(gradients.primary).toContain('linear-gradient');
      expect(gradients.secondary).toContain('linear-gradient');
      expect(gradients.success).toContain('linear-gradient');
    });

    it('should have dark gradient', () => {
      expect(gradients.dark).toBe('linear-gradient(135deg, #434343 0%, #000000 100%)');
    });

    it('should have midnight gradient with multiple stops', () => {
      expect(gradients.midnight).toContain('0f0c29');
      expect(gradients.midnight).toContain('302b63');
      expect(gradients.midnight).toContain('24243e');
    });
  });

  describe('glassmorphism', () => {
    it('should have light theme glass effect', () => {
      expect(glassmorphism.light).toHaveProperty('background');
      expect(glassmorphism.light).toHaveProperty('backgroundHover');
      expect(glassmorphism.light).toHaveProperty('border');
      expect(glassmorphism.light).toHaveProperty('blur');
      expect(glassmorphism.light).toHaveProperty('shadow');
    });

    it('should have dark theme glass effect', () => {
      expect(glassmorphism.dark).toHaveProperty('background');
      expect(glassmorphism.dark).toHaveProperty('backgroundHover');
      expect(glassmorphism.dark).toHaveProperty('border');
      expect(glassmorphism.dark).toHaveProperty('blur');
      expect(glassmorphism.dark).toHaveProperty('shadow');
    });

    it('should have rgba background for light theme', () => {
      expect(glassmorphism.light.background).toContain('rgba');
      expect(glassmorphism.light.background).toContain('255');
    });

    it('should have darker background for dark theme', () => {
      expect(glassmorphism.dark.background).toContain('rgba');
      expect(glassmorphism.dark.background).toMatch(/17,\s*25/);
    });

    it('should have blur effect', () => {
      expect(glassmorphism.light.blur).toBe('blur(10px)');
      expect(glassmorphism.dark.blur).toBe('blur(16px)');
    });
  });

  describe('lightTheme', () => {
    it('should be defined', () => {
      expect(lightTheme).toBeDefined();
    });

    it('should have token property', () => {
      expect(lightTheme).toHaveProperty('token');
    });

    it('should have color tokens', () => {
      expect(lightTheme.token).toHaveProperty('colorPrimary');
      expect(lightTheme.token).toHaveProperty('colorBgContainer');
      expect(lightTheme.token).toHaveProperty('colorText');
    });
  });

  describe('darkTheme', () => {
    it('should be defined', () => {
      expect(darkTheme).toBeDefined();
    });

    it('should have token property', () => {
      expect(darkTheme).toHaveProperty('token');
    });

    it('should have colorPrimary', () => {
      expect(darkTheme.token).toHaveProperty('colorPrimary');
    });
  });
});
