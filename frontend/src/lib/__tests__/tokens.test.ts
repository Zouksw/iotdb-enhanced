import {
  lightColors,
  darkColors,
  spacing,
  borderRadius,
  shadows,
  typography,
  componentTokens,
} from '../tokens';

describe('tokens', () => {
  describe('lightColors', () => {
    it('should have primary colors', () => {
      expect(lightColors).toHaveProperty('primary');
      expect(lightColors).toHaveProperty('primaryBg');
      expect(lightColors).toHaveProperty('primaryText');
    });

    it('should have semantic colors', () => {
      expect(lightColors).toHaveProperty('success');
      expect(lightColors).toHaveProperty('warning');
      expect(lightColors).toHaveProperty('error');
      expect(lightColors).toHaveProperty('info');
    });

    it('should have gray scale', () => {
      expect(lightColors).toHaveProperty('gray50');
      expect(lightColors).toHaveProperty('gray100');
      expect(lightColors).toHaveProperty('gray500');
      expect(lightColors).toHaveProperty('gray900');
    });

    it('should have hex color values', () => {
      expect(lightColors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(lightColors.success).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('darkColors', () => {
    it('should be defined', () => {
      expect(darkColors).toBeDefined();
    });

    it('should have primary colors', () => {
      expect(darkColors).toHaveProperty('primary');
      expect(darkColors).toHaveProperty('primaryBg');
    });
  });

  describe('spacing', () => {
    it('should have spacing scale', () => {
      expect(spacing).toHaveProperty('spacing0');
      expect(spacing).toHaveProperty('spacing1');
      expect(spacing).toHaveProperty('spacing4');
      expect(spacing).toHaveProperty('spacing8');
    });

    it('should have padding tokens', () => {
      expect(spacing).toHaveProperty('paddingXS');
      expect(spacing).toHaveProperty('paddingSM');
      expect(spacing).toHaveProperty('paddingMD');
      expect(spacing).toHaveProperty('paddingLG');
      expect(spacing).toHaveProperty('paddingXL');
    });

    it('should have margin tokens', () => {
      expect(spacing).toHaveProperty('marginXS');
      expect(spacing).toHaveProperty('marginSM');
      expect(spacing).toHaveProperty('marginMD');
      expect(spacing).toHaveProperty('marginLG');
      expect(spacing).toHaveProperty('marginXL');
    });

    it('should have gap tokens', () => {
      expect(spacing).toHaveProperty('gapSM');
      expect(spacing).toHaveProperty('gapMD');
      expect(spacing).toHaveProperty('gapLG');
      expect(spacing).toHaveProperty('gapXL');
    });

    it('should have rem string values', () => {
      expect(spacing.spacing1).toBe('0.25rem');
      expect(spacing.spacing4).toBe('1rem');
      expect(spacing.paddingSM).toBe('0.75rem');
    });
  });

  describe('borderRadius', () => {
    it('should have radius scale with uppercase keys', () => {
      expect(borderRadius).toHaveProperty('XS');
      expect(borderRadius).toHaveProperty('SM');
      expect(borderRadius).toHaveProperty('MD');
      expect(borderRadius).toHaveProperty('LG');
      expect(borderRadius).toHaveProperty('XL');
      expect(borderRadius).toHaveProperty('Full');
    });

    it('should have numeric pixel values', () => {
      expect(typeof borderRadius.XS).toBe('number');
      expect(typeof borderRadius.SM).toBe('number');
      expect(typeof borderRadius.MD).toBe('number');
    });

    it('should have full radius for circles', () => {
      expect(borderRadius.Full).toBe(9999);
    });

    it('should have increasing values', () => {
      expect(borderRadius.XS).toBeLessThan(borderRadius.SM);
      expect(borderRadius.SM).toBeLessThan(borderRadius.MD);
      expect(borderRadius.MD).toBeLessThan(borderRadius.LG);
    });
  });

  describe('shadows', () => {
    it('should have shadow scale', () => {
      expect(shadows).toHaveProperty('XS');
      expect(shadows).toHaveProperty('SM');
      expect(shadows).toHaveProperty('MD');
      expect(shadows).toHaveProperty('LG');
      expect(shadows).toHaveProperty('XL');
    });

    it('should have dark shadow variants', () => {
      expect(shadows).toHaveProperty('darkSM');
      expect(shadows).toHaveProperty('darkMD');
      expect(shadows).toHaveProperty('darkLG');
    });

    it('should have colored shadows', () => {
      expect(shadows).toHaveProperty('primary');
      expect(shadows).toHaveProperty('success');
      expect(shadows).toHaveProperty('error');
    });

    it('should have CSS box-shadow values', () => {
      expect(typeof shadows.XS).toBe('string');
      expect(typeof shadows.SM).toBe('string');
      expect(typeof shadows.MD).toBe('string');
    });
  });

  describe('typography', () => {
    it('should have font size tokens', () => {
      expect(typography).toHaveProperty('fontSizeXS');
      expect(typography).toHaveProperty('fontSizeSM');
      expect(typography).toHaveProperty('fontSizeBase');
      expect(typography).toHaveProperty('fontSizeLG');
      expect(typography).toHaveProperty('fontSizeXL');
    });

    it('should have heading font sizes', () => {
      expect(typography).toHaveProperty('fontSizeHeading1');
      expect(typography).toHaveProperty('fontSizeHeading2');
      expect(typography).toHaveProperty('fontSizeHeading3');
    });

    it('should have rem string values', () => {
      expect(typography.fontSizeXS).toBe('0.75rem');
      expect(typography.fontSizeBase).toBe('1rem');
    });
  });

  describe('componentTokens', () => {
    it('should be defined', () => {
      expect(componentTokens).toBeDefined();
    });

    it('should have button tokens', () => {
      expect(componentTokens).toHaveProperty('buttonBorderRadius');
      expect(componentTokens).toHaveProperty('buttonHeightMD');
      expect(componentTokens).toHaveProperty('buttonPaddingMD');
    });

    it('should have input tokens', () => {
      expect(componentTokens).toHaveProperty('inputBorderRadius');
      expect(componentTokens).toHaveProperty('inputHeightMD');
      expect(componentTokens).toHaveProperty('inputPadding');
    });

    it('should have card tokens', () => {
      expect(componentTokens).toHaveProperty('cardBorderRadius');
      expect(componentTokens).toHaveProperty('cardPadding');
      expect(componentTokens).toHaveProperty('cardMarginBottom');
    });

    it('should have table tokens', () => {
      expect(componentTokens).toHaveProperty('tableBorderRadius');
      expect(componentTokens).toHaveProperty('tableCellPadding');
      expect(componentTokens).toHaveProperty('tableRowHoverBg');
    });

    it('should have modal tokens', () => {
      expect(componentTokens).toHaveProperty('modalBorderRadius');
      expect(componentTokens).toHaveProperty('modalPadding');
      expect(componentTokens).toHaveProperty('modalHeaderPadding');
    });
  });
});
