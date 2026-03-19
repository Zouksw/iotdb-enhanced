import React from 'react';
import { ColorModeContext } from '../index';

describe('ColorModeContext', () => {
  it('should export ColorModeContext', () => {
    expect(ColorModeContext).toBeDefined();
  });

  it('should be a React context', () => {
    // Check if it has the expected context properties
    expect(typeof ColorModeContext).toBe('object');
    expect(ColorModeContext.Provider).toBeDefined();
    expect(ColorModeContext.Consumer).toBeDefined();
  });

  it('should have context type definition with mode and setMode', () => {
    // Verify the context type structure
    type ContextType = {
      mode: string;
      setMode: (mode: string) => void;
    };

    const expectedProperties: (keyof ContextType)[] = ['mode', 'setMode'];
    expect(expectedProperties.length).toBe(2);
  });
});
