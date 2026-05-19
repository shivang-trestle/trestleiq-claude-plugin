import { describe, it, expect } from 'vitest';
import { detectShellRc, hasTrestleMarker } from './setup.js';

describe('detectShellRc', () => {
  it('maps zsh to .zshrc', () => {
    expect(detectShellRc('/bin/zsh', '/home/u')).toBe('/home/u/.zshrc');
  });
  it('maps bash to .bashrc', () => {
    expect(detectShellRc('/usr/bin/bash', '/home/u')).toBe('/home/u/.bashrc');
  });
  it('maps fish to fish config', () => {
    expect(detectShellRc('/usr/local/bin/fish', '/home/u')).toBe('/home/u/.config/fish/config.fish');
  });
  it('falls back to .profile for unknown shells', () => {
    expect(detectShellRc('/bin/csh', '/home/u')).toBe('/home/u/.profile');
  });
});

describe('hasTrestleMarker', () => {
  it('detects the marker comment', () => {
    expect(hasTrestleMarker('export TRESTLE_API_KEY="abc" # trestleiq-claude-plugin')).toBe(true);
  });
  it('returns false when absent', () => {
    expect(hasTrestleMarker('# nothing here\nexport FOO=bar')).toBe(false);
  });
});
