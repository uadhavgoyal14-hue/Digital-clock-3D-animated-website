/* ============================================================================
   CHRONOS // Master Logic: Real-Time Clock, Precision Stopwatch & Alarm
   ============================================================================ */

// Global State
let is24HourFormat = true;
let isAudioEnabled = true;
let audioCtx = null;

// Stopwatch Engine Variables
window.isStopwatchRunning = false;
window.stopwatchElapsed = 0;
let swStartTime = 0;
let swRafId = null;
let lapTimes = [];
let lastLapTimestamp = 0;

// Alarm Engine Variables
window.isAlarmRinging = false;
let alarmInterval = null;

// ----------------------------------------------------------------------------
// 1. Web Audio API Tactile Mechanical & Bell Chime Synthesizer
// ----------------------------------------------------------------------------
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playMechanicalSound(type = 'click') {
    if (!isAudioEnabled) return;
    try {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        if (type === 'start') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, t);
            osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.04);
        } else if (type === 'stop') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
            gain.gain.setValueAtTime(0.14, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.06);
        } else if (type === 'lap') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1760, t);
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.08);
        } else if (type === 'bell') {
            // Authentic Twin Bell Metallic Chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2093, t); // C7 bell ring
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.08);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, t);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.03);
        }
    } catch (e) {}
}

function toggleAudio() {
    isAudioEnabled = !isAudioEnabled;
    const btn = document.getElementById('btnAudio');
    if (btn) {
        btn.querySelector('.btn-icon').textContent = isAudioEnabled ? '🔊' : '🔇';
        btn.querySelector('.btn-label').textContent = isAudioEnabled ? 'AUDIO' : 'MUTED';
    }
    if (isAudioEnabled) playMechanicalSound('click');
}

// ----------------------------------------------------------------------------
// 2. Alarm Bell Striker Simulator
// ----------------------------------------------------------------------------
function toggleTestAlarm() {
    const btn = document.getElementById('btnTestAlarm');
    if (!window.isAlarmRinging) {
        window.isAlarmRinging = true;
        if (btn) {
            btn.innerHTML = '<span>⏹ STOP RINGING</span>';
            btn.classList.add('push-btn--stop');
            btn.classList.remove('push-btn--start');
        }

        // Ring rapidly (15 strikes per second)
        alarmInterval = setInterval(() => {
            playMechanicalSound('bell');
        }, 65);

    } else {
        window.isAlarmRinging = false;
        clearInterval(alarmInterval);
        if (btn) {
            btn.innerHTML = '<span>🔔 RING BELLS</span>';
            btn.classList.add('push-btn--start');
            btn.classList.remove('push-btn--stop');
        }
    }
}

// ----------------------------------------------------------------------------
// 3. Synchronized Live Real-Time Digital Clock
// ----------------------------------------------------------------------------
function updateLiveClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    let ampm = '';

    if (!is24HourFormat) {
        ampm = hours >= 12 ? ' PM' : ' AM';
        hours = hours % 12 || 12;
    }
    const formattedHours = String(hours).padStart(2, '0');
    const timeString = `${formattedHours}:${minutes}:${seconds}${ampm}`;

    const heroClock = document.getElementById('clock');
    if (heroClock) heroClock.textContent = timeString;

    const navClock = document.getElementById('nav-live-clock');
    if (navClock) navClock.textContent = timeString;

    const dateEl = document.getElementById('date');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString(undefined, options);
    }
}

function toggleFormat() {
    is24HourFormat = !is24HourFormat;
    const btnText = document.getElementById('formatText');
    if (btnText) btnText.textContent = is24HourFormat ? '24H' : '12H';
    playMechanicalSound('click');
    updateLiveClock();
}

setInterval(updateLiveClock, 1000);
updateLiveClock();

// ----------------------------------------------------------------------------
// 4. Millisecond Stopwatch & Chronometer Suite
// ----------------------------------------------------------------------------
function formatMs(ms) {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const hundredths = Math.floor(ms % 1000);

    const pad = (n, len = 2) => String(n).padStart(len, '0');
    return {
        hours: pad(hrs),
        mins: pad(mins),
        secs: pad(secs),
        millis: pad(hundredths, 3)
    };
}

function renderStopwatchDisplay() {
    const f = formatMs(window.stopwatchElapsed);
    const hEl = document.getElementById('swHours');
    const mEl = document.getElementById('swMins');
    const sEl = document.getElementById('swSecs');
    const msEl = document.getElementById('swMillis');

    if (hEl) hEl.textContent = f.hours;
    if (mEl) mEl.textContent = f.mins;
    if (sEl) sEl.textContent = f.secs;
    if (msEl) msEl.textContent = f.millis;
}

function tickStopwatch() {
    if (!window.isStopwatchRunning) return;
    window.stopwatchElapsed = performance.now() - swStartTime;
    renderStopwatchDisplay();
    swRafId = requestAnimationFrame(tickStopwatch);
}

function start() {
    if (window.isStopwatchRunning) return;
    window.isStopwatchRunning = true;
    swStartTime = performance.now() - window.stopwatchElapsed;
    playMechanicalSound('start');

    const dot = document.getElementById('chronoStatusDot');
    const text = document.getElementById('chronoStatusText');
    if (dot) dot.classList.add('active');
    if (text) text.textContent = 'CHRONO RUNNING';

    swRafId = requestAnimationFrame(tickStopwatch);
}

function stop() {
    if (!window.isStopwatchRunning) return;
    window.isStopwatchRunning = false;
    cancelAnimationFrame(swRafId);
    playMechanicalSound('stop');

    const dot = document.getElementById('chronoStatusDot');
    const text = document.getElementById('chronoStatusText');
    if (dot) dot.classList.remove('active');
    if (text) text.textContent = 'CHRONO STOPPED';
}

function reset() {
    stop();
    window.stopwatchElapsed = 0;
    lastLapTimestamp = 0;
    lapTimes = [];
    renderStopwatchDisplay();
    playMechanicalSound('click');

    const dot = document.getElementById('chronoStatusDot');
    const text = document.getElementById('chronoStatusText');
    if (dot) dot.classList.remove('active');
    if (text) text.textContent = 'READY TO RECORD';

    const lapContainer = document.getElementById('lapContainer');
    const lapList = document.getElementById('lapList');
    if (lapList) lapList.innerHTML = '';
    if (lapContainer) lapContainer.style.display = 'none';

    updateTelemetryMetrics();
}

function recordLap() {
    if (!window.isStopwatchRunning && window.stopwatchElapsed === 0) return;

    const currentTotal = window.stopwatchElapsed;
    const splitInterval = currentTotal - lastLapTimestamp;
    lastLapTimestamp = currentTotal;

    const lapIndex = lapTimes.length + 1;
    lapTimes.push({ index: lapIndex, split: splitInterval, total: currentTotal });

    playMechanicalSound('lap');

    const lapContainer = document.getElementById('lapContainer');
    const lapList = document.getElementById('lapList');
    if (lapContainer && lapList) {
        lapContainer.style.display = 'block';

        const fSplit = formatMs(splitInterval);
        const fTotal = formatMs(currentTotal);

        const row = document.createElement('div');
        row.className = 'lap-row';
        row.innerHTML = `
            <span class="lap-num">LAP #${String(lapIndex).padStart(2, '0')}</span>
            <span class="lap-split">+${fSplit.mins}:${fSplit.secs}.${fSplit.millis}</span>
            <span class="lap-total">${fTotal.mins}:${fTotal.secs}.${fTotal.millis}</span>
        `;
        lapList.insertBefore(row, lapList.firstChild);
    }

    updateTelemetryMetrics();
}

function updateTelemetryMetrics() {
    const countEl = document.getElementById('metricLapsCount');
    const bestEl = document.getElementById('metricBestLap');
    const avgEl = document.getElementById('metricAvgLap');

    if (!lapTimes.length) {
        if (countEl) countEl.textContent = '0';
        if (bestEl) bestEl.textContent = '--:--.---';
        if (avgEl) avgEl.textContent = '--:--.---';
        return;
    }

    if (countEl) countEl.textContent = String(lapTimes.length);

    let minSplit = Math.min(...lapTimes.map(l => l.split));
    const fBest = formatMs(minSplit);
    if (bestEl) bestEl.textContent = `${fBest.mins}:${fBest.secs}.${fBest.millis}`;

    const totalSplitSum = lapTimes.reduce((acc, curr) => acc + curr.split, 0);
    const avgSplit = totalSplitSum / lapTimes.length;
    const fAvg = formatMs(avgSplit);
    if (avgEl) avgEl.textContent = `${fAvg.mins}:${fAvg.secs}.${fAvg.millis}`;
}

function copyLapRecords() {
    if (!lapTimes.length) {
        alert('No lap intervals recorded yet. Start the stopwatch and record some laps!');
        return;
    }

    let exportText = "CHRONOS // LAP RECORDS TELEMETRY\n";
    exportText += "--------------------------------------\n";
    lapTimes.forEach(l => {
        const s = formatMs(l.split);
        const t = formatMs(l.total);
        exportText += `Lap ${String(l.index).padStart(2, '0')}: Split +${s.mins}:${s.secs}.${s.millis} | Total ${t.mins}:${t.secs}.${t.millis}\n`;
    });
    exportText += "--------------------------------------\n";

    navigator.clipboard.writeText(exportText).then(() => {
        playMechanicalSound('lap');
        alert('Lap records copied to clipboard!');
    });
}

// ----------------------------------------------------------------------------
// 5. Smooth Navigation & Scroll Section Rail Tracking
// ----------------------------------------------------------------------------
function scrollToSection(index) {
    const sections = document.querySelectorAll('.story-section');
    if (sections[index]) {
        sections[index].scrollIntoView({ behavior: 'smooth' });
    }
}

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.story-section');
    const dots = document.querySelectorAll('.rail-dot');
    const scrollHint = document.getElementById('scrollHint');

    const scrollY = window.scrollY;
    let currentIdx = 0;

    sections.forEach((sec, idx) => {
        const top = sec.offsetTop - 300;
        if (scrollY >= top) {
            currentIdx = idx;
        }
    });

    dots.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === currentIdx);
    });

    if (scrollHint) {
        scrollHint.style.opacity = scrollY > 200 ? '0' : '1';
    }
}, { passive: true });

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
        e.preventDefault();
        window.isStopwatchRunning ? stop() : start();
    } else if (e.key === 'l' || e.key === 'L') {
        recordLap();
    } else if (e.key === 'r' || e.key === 'R') {
        reset();
    }
});
