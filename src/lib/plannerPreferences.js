"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PLANNER_PREFERENCES = void 0;
exports.validatePlannerPreferences = validatePlannerPreferences;
exports.loadPlannerPreferences = loadPlannerPreferences;
exports.savePlannerPreferences = savePlannerPreferences;
exports.DEFAULT_PLANNER_PREFERENCES = {
    weekdayWorkStart: '17:00',
    weekdayWorkEnd: '22:00',
    weekendWorkStart: '10:00',
    weekendWorkEnd: '20:00',
    minSessionDuration: 30,
    prefSessionDuration: 60,
    bufferDuration: 15,
};
var STORAGE_KEY = 'semester_os_planner_prefs';
function validatePlannerPreferences(prefs) {
    var errors = {};
    var parseTime = function (t) {
        var _a = t.split(':').map(Number), h = _a[0], m = _a[1];
        return h * 60 + m;
    };
    if (parseTime(prefs.weekdayWorkStart) >= parseTime(prefs.weekdayWorkEnd)) {
        errors.weekdayWorkStart = 'Start time must be before end time.';
    }
    if (parseTime(prefs.weekendWorkStart) >= parseTime(prefs.weekendWorkEnd)) {
        errors.weekendWorkStart = 'Start time must be before end time.';
    }
    if (prefs.minSessionDuration < 10 || prefs.minSessionDuration > 180) {
        errors.minSessionDuration = 'Must be between 10 and 180 minutes.';
    }
    if (prefs.prefSessionDuration < prefs.minSessionDuration) {
        errors.prefSessionDuration = 'Cannot be less than minimum session.';
    }
    else if (prefs.prefSessionDuration > 240) {
        errors.prefSessionDuration = 'Cannot exceed 240 minutes.';
    }
    if (prefs.bufferDuration < 0 || prefs.bufferDuration > 60) {
        errors.bufferDuration = 'Must be between 0 and 60 minutes.';
    }
    return {
        valid: Object.keys(errors).length === 0,
        errors: errors
    };
}
function loadPlannerPreferences() {
    if (typeof window === 'undefined')
        return exports.DEFAULT_PLANNER_PREFERENCES;
    try {
        var data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            var parsed = JSON.parse(data);
            return __assign(__assign({}, exports.DEFAULT_PLANNER_PREFERENCES), parsed);
        }
        return exports.DEFAULT_PLANNER_PREFERENCES;
    }
    catch (e) {
        console.error('Failed to load planner preferences', e);
        return exports.DEFAULT_PLANNER_PREFERENCES;
    }
}
function savePlannerPreferences(prefs) {
    if (typeof window === 'undefined')
        return false;
    var valid = validatePlannerPreferences(prefs).valid;
    if (!valid)
        return false;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        return true;
    }
    catch (e) {
        console.error('Failed to save planner preferences', e);
        return false;
    }
}
