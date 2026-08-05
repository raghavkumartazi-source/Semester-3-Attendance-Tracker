"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var plannerAlgorithm_1 = require("./src/lib/plannerAlgorithm");
var plannerPreferences_1 = require("./src/lib/plannerPreferences");
var tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(23, 59, 59, 999);
var tasks = [
    {
        id: 'test-task-1',
        title: 'Test Task HIGH Priority',
        completed: false,
        deleted_at: null,
        due_at: tomorrow.toISOString(),
        estimated_minutes: 120,
        priority: 'HIGH',
        type: 'STUDY',
        user_id: 'test-user',
        subject_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        notes: null
    }
];
var workSessions = [];
var classSessions = [];
console.log('Running test...');
(0, plannerAlgorithm_1.generateSmartPlan)(tasks, classSessions, workSessions, plannerPreferences_1.DEFAULT_PLANNER_PREFERENCES);
