import { describe, it, expect } from 'vitest';
import {
  calculateAttendance,
  calculateCanBunk,
  calculateNeedToAttend,
  calculateStatus,
} from '../calculations';

describe('calculations', () => {
  describe('calculateAttendance', () => {
    it('returns null for 0 total classes', () => {
      expect(calculateAttendance(0, 0)).toBeNull();
    });

    it('calculates correct percentage', () => {
      expect(calculateAttendance(5, 5)).toBe(50);
      expect(calculateAttendance(10, 0)).toBe(100);
      expect(calculateAttendance(3, 1)).toBe(75);
      expect(calculateAttendance(1, 2)).toBe(33.33333333333333); // Should match float
      expect(calculateAttendance(2, 1)).toBe(66.66666666666666);
    });
  });

  describe('calculateCanBunk', () => {
    it('returns correct number of classes you can bunk to stay >= 75%', () => {
      expect(calculateCanBunk(10, 0)).toBe(3); // 10 present, 0 absent
      expect(calculateCanBunk(75, 25)).toBe(0); // 75 present, 25 absent (75%)
      expect(calculateCanBunk(3, 1)).toBe(0); // 3 present, 1 absent (75%)
      expect(calculateCanBunk(0, 0)).toBe(0); // 0/0
      expect(calculateCanBunk(50, 50)).toBe(0); // 50 present, 50 absent (Below 75%)
    });
  });

  describe('calculateNeedToAttend', () => {
    it('returns correct number of classes needed to reach 75%', () => {
      expect(calculateNeedToAttend(50, 50)).toBe(100); // Need 100 more classes: (150/200) = 75%
      expect(calculateNeedToAttend(0, 1)).toBe(3); // (3/4) = 75%
      expect(calculateNeedToAttend(75, 25)).toBe(0); // Already at 75%
      expect(calculateNeedToAttend(10, 0)).toBe(0); // Above 75%
      expect(calculateNeedToAttend(0, 0)).toBe(0);
    });
  });

  describe('calculateStatus', () => {
    it('returns correct status based on thresholds', () => {
      expect(calculateStatus(85, 15)).toBe('SAFE'); // >= 80
      expect(calculateStatus(80, 20)).toBe('SAFE');
      expect(calculateStatus(79, 21)).toBe('WARNING'); // >= 75
      expect(calculateStatus(75, 25)).toBe('WARNING');
      expect(calculateStatus(74, 26)).toBe('DANGER'); // < 75
      expect(calculateStatus(0, 0)).toBe('NO_DATA');
    });
  });
});
