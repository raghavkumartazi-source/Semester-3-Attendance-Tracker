"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSmartPlan = void 0;
var plannerPreferences_1 = require("./plannerPreferences");
var generateSmartPlan = function (tasks, classSessions, workSessions, prefs) {
    if (prefs === void 0) { prefs = (0, plannerPreferences_1.loadPlannerPreferences)(); }
    var suggestedSessions = [];
    var overloadedTasks = [];
    // 1. Filter and prepare tasks
    var now = new Date();
    console.log('=== PLANNER WINDOW DEBUG ===');
    console.log("current local datetime: ".concat(now.toString()));
    console.log("current local ISO date: ".concat(now.toISOString()));
    console.log("planning horizon start: ".concat(now.toISOString()));
    console.log("planning horizon end (max): ".concat(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()));
    console.log("weekday work window: ".concat(prefs.weekdayWorkStart, " - ").concat(prefs.weekdayWorkEnd));
    console.log("weekend work window: ".concat(prefs.weekendWorkStart, " - ").concat(prefs.weekendWorkEnd));
    console.log("minSessionDuration: ".concat(prefs.minSessionDuration));
    console.log("prefSessionDuration: ".concat(prefs.prefSessionDuration));
    console.log("bufferDuration: ".concat(prefs.bufferDuration));
    console.log('============================');
    console.log('=== PLANNER TASK DEBUG ===');
    var incompleteTasks = tasks.filter(function (t) {
        var eligible = true;
        var reason = '';
        if (t.completed) {
            eligible = false;
            reason = 'completed';
        }
        else if (t.deleted_at) {
            eligible = false;
            reason = 'deleted';
        }
        else if (!t.estimated_minutes) {
            eligible = false;
            reason = 'no estimated_minutes';
        }
        else if (!t.due_at) {
            eligible = false;
            reason = 'no due_at';
        }
        var existingSessions = workSessions.filter(function (s) { return s.task_id === t.id && s.status === 'PLANNED' && !s.deleted_at; });
        var plannedMinutes = existingSessions.reduce(function (total, s) {
            var start = new Date(s.planned_start).getTime();
            var end = new Date(s.planned_end).getTime();
            return total + Math.round((end - start) / 60000);
        }, 0);
        var unallocatedMinutes = eligible ? Math.max(0, (t.estimated_minutes || 0) - plannedMinutes) : 0;
        console.log("- Task: [".concat(t.id, "] ").concat(t.title));
        console.log("  completed: ".concat(t.completed));
        console.log("  deleted_at: ".concat(t.deleted_at));
        console.log("  due_at: ".concat(t.due_at));
        console.log("  estimated_minutes: ".concat(t.estimated_minutes));
        console.log("  priority: ".concat(t.priority));
        console.log("  existing PLANNED minutes: ".concat(plannedMinutes));
        console.log("  calculated unallocatedMinutes: ".concat(unallocatedMinutes));
        console.log("  eligible: ".concat(eligible).concat(!eligible ? " (reason: ".concat(reason, ")") : ''));
        return eligible;
    });
    console.log('==========================');
    if (incompleteTasks.length === 0)
        return { sessions: [], overloadedTasks: [] };
    // Calculate remaining effort for each task
    var taskNeeds = incompleteTasks.map(function (t) {
        var existingSessions = workSessions.filter(function (s) { return s.task_id === t.id && s.status === 'PLANNED' && !s.deleted_at; });
        var plannedMinutes = existingSessions.reduce(function (total, s) {
            var start = new Date(s.planned_start).getTime();
            var end = new Date(s.planned_end).getTime();
            return total + Math.round((end - start) / 60000);
        }, 0);
        return {
            task: t,
            remainingMinutes: Math.max(0, (t.estimated_minutes || 0) - plannedMinutes),
            dueDate: new Date(t.due_at)
        };
    }).filter(function (t) { return t.remainingMinutes > 0; });
    // Sort tasks by priority, urgency
    taskNeeds.sort(function (a, b) {
        // Treat overdue tasks with very high urgency
        var isOverdueA = a.dueDate.getTime() < now.getTime();
        var isOverdueB = b.dueDate.getTime() < now.getTime();
        if (isOverdueA && !isOverdueB)
            return -1;
        if (isOverdueB && !isOverdueA)
            return 1;
        // 1. Urgency
        var daysA = Math.max(0, (a.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        var daysB = Math.max(0, (b.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        // 2. Priority
        var pWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        var pA = pWeight[a.task.priority];
        var pB = pWeight[b.task.priority];
        var scoreA = (10 / (daysA + 1)) * pA;
        var scoreB = (10 / (daysB + 1)) * pB;
        return scoreB - scoreA; // descending
    });
    // Prepare existing commitments
    var blockedTimes = [];
    // Add class sessions to blocked times
    classSessions.forEach(function (s) {
        var d = new Date(s.date);
        var _a = s.startTime.split(':').map(Number), h = _a[0], m = _a[1];
        d.setHours(h, m, 0, 0);
        var end = new Date(d);
        end.setMinutes(end.getMinutes() + (s.classType === 'Lab' ? 120 : 60));
        // Add buffer
        d.setMinutes(d.getMinutes() - prefs.bufferDuration);
        end.setMinutes(end.getMinutes() + prefs.bufferDuration);
        blockedTimes.push({ start: d, end: end });
    });
    // Add existing work sessions
    workSessions.filter(function (s) { return s.status !== 'CANCELLED' && !s.deleted_at; }).forEach(function (s) {
        var start = new Date(s.planned_start);
        var end = new Date(s.planned_end);
        start.setMinutes(start.getMinutes() - prefs.bufferDuration);
        end.setMinutes(end.getMinutes() + prefs.bufferDuration);
        blockedTimes.push({ start: start, end: end });
    });
    // 14 days lookahead
    for (var _i = 0, taskNeeds_1 = taskNeeds; _i < taskNeeds_1.length; _i++) {
        var tNeed = taskNeeds_1[_i];
        var remaining = tNeed.remainingMinutes;
        var currentDay = new Date(now);
        currentDay.setHours(0, 0, 0, 0);
        // For overdue tasks, schedule before a virtual deadline of 14 days
        var isOverdue = tNeed.dueDate.getTime() < now.getTime();
        var deadline = isOverdue ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : new Date(tNeed.dueDate);
        deadline.setHours(23, 59, 59, 999);
        var _loop_1 = function () {
            var isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
            var startStr = isWeekend ? prefs.weekendWorkStart : prefs.weekdayWorkStart;
            var endStr = isWeekend ? prefs.weekendWorkEnd : prefs.weekdayWorkEnd;
            console.log("\n=== PLANNER DAY DEBUG: ".concat(currentDay.toLocaleDateString(), " ==="));
            console.log("configured work start/end: ".concat(startStr, " - ").concat(endStr));
            console.log("class blocks: ".concat(blockedTimes.length, " total blocks (classes & sessions) configured in system"));
            var _a = startStr.split(':').map(Number), sh = _a[0], sm = _a[1];
            var _b = endStr.split(':').map(Number), eh = _b[0], em = _b[1];
            var workStart = new Date(currentDay);
            workStart.setHours(sh, sm, 0, 0);
            var workEnd = new Date(currentDay);
            workEnd.setHours(eh, em, 0, 0);
            // We will try to place blocks of prefSessionDuration, or down to minSessionDuration
            var iterTime = new Date(Math.max(workStart.getTime(), now.getTime()));
            var _loop_2 = function () {
                var potentialSession = Math.min(remaining, prefs.prefSessionDuration);
                var iterEnd = new Date(iterTime);
                iterEnd.setMinutes(iterEnd.getMinutes() + potentialSession);
                if (iterEnd > workEnd) {
                    iterTime = new Date(iterEnd); // Push forward to break loop
                    return "continue";
                }
                // Check if [iterTime, iterEnd] overlaps with any blockedTimes or newly suggestedSessions
                var overlapsBlocked = blockedTimes.some(function (b) {
                    return (iterTime < b.end && iterEnd > b.start);
                });
                var overlapsSuggested = suggestedSessions.some(function (s) {
                    var ss = new Date(s.planned_start);
                    var se = new Date(s.planned_end);
                    ss.setMinutes(ss.getMinutes() - prefs.bufferDuration);
                    se.setMinutes(se.getMinutes() + prefs.bufferDuration);
                    return (iterTime < se && iterEnd > ss);
                });
                if (!overlapsBlocked && !overlapsSuggested) {
                    console.log("  -> Found free block: ".concat(iterTime.toLocaleTimeString(), " to ").concat(iterEnd.toLocaleTimeString(), " (duration: ").concat(potentialSession, "m)"));
                    // Valid block found!
                    suggestedSessions.push({
                        task_id: tNeed.task.id,
                        planned_start: iterTime.toISOString(),
                        planned_end: iterEnd.toISOString(),
                        status: 'PLANNED'
                    });
                    remaining -= potentialSession;
                    iterTime = new Date(iterEnd);
                    iterTime.setMinutes(iterTime.getMinutes() + prefs.bufferDuration);
                }
                else {
                    // Advance iterTime by 15 mins to search next slot
                    iterTime.setMinutes(iterTime.getMinutes() + 15);
                }
            };
            while (iterTime < workEnd && remaining >= prefs.minSessionDuration) {
                _loop_2();
            }
            currentDay.setDate(currentDay.getDate() + 1);
        };
        while (remaining > 0 && currentDay <= deadline && currentDay.getTime() < now.getTime() + 14 * 24 * 60 * 60 * 1000) {
            _loop_1();
        }
        if (remaining >= prefs.minSessionDuration) {
            overloadedTasks.push(tNeed.task);
        }
    }
    console.log('\n=== PLANNER RESULT DEBUG ===');
    console.log("eligible task count: ".concat(taskNeeds.length));
    console.log("proposed session count: ".concat(suggestedSessions.length));
    var totalMins = suggestedSessions.reduce(function (acc, s) {
        var start = new Date(s.planned_start).getTime();
        var end = new Date(s.planned_end).getTime();
        return acc + Math.round((end - start) / 60000);
    }, 0);
    console.log("total proposed minutes: ".concat(totalMins));
    console.log("overloaded task count: ".concat(overloadedTasks.length));
    if (overloadedTasks.length > 0) {
        console.log("overloaded tasks: ".concat(overloadedTasks.map(function (t) { return t.title; }).join(', ')));
    }
    console.log('============================\n');
    return { sessions: suggestedSessions, overloadedTasks: overloadedTasks };
};
exports.generateSmartPlan = generateSmartPlan;
