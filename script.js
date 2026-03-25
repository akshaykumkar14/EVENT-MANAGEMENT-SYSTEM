const supabaseUrl = 'https://hayevqhydoxjnrxatamj.supabase.co';
const supabaseKey = 'sb_publishable_JWNLzffPit_9klcsA2r8sw_E6gTR2fe';
let supabaseClient = null;

try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn("Supabase CDN not loaded. Running in local mode.");
    }
} catch (e) {
    console.error("Failed to init Supabase", e);
}
let events = [];
let tasks = [];
let participants = [];
let proposals = [];
let isLoggedIn = false;
let currentModule = 'eventPlanning';

function initApp() {
    loadData();
    updateProposalCount();
    updatePublicStats();
    initBackgroundAnimation();

    // Initialize custom date pickers
    flatpickr('input[type="date"]', {
        dateFormat: "Y-m-d",
        minDate: "today",
        animate: true
    });

    // Clear login message on input
    ['username', 'password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                const msg = document.getElementById('loginMessage');
                if (msg) msg.innerHTML = '';
            });
        }
    });
}

window.addEventListener('DOMContentLoaded', initApp);

// Load data from localStorage
function loadData() {
    let storedEvents = JSON.parse(localStorage.getItem('events'));

    // Seed default data if completely empty (first time load)
    if (!storedEvents || storedEvents.length === 0) {
        events = [
            { id: 1, name: "Web Dev Workshop", date: "2026-04-10", description: "Learn React and Node.js in this comprehensive workshop." },
            { id: 2, name: "Science Exhibition", date: "2026-05-15", description: "Annual college science project exhibition." }
        ];
        tasks = [
            { id: 101, task: "Book Seminar Hall", person: "Alice", eventId: 1, status: "Completed" },
            { id: 102, task: "Order Lunch", person: "Bob", eventId: 1, status: "In Progress" }
        ];
        participants = [
            { id: 201, name: "Charlie", email: "charlie@email.com", eventId: 1 }
        ];
        proposals = [
            { id: 301, name: "Chess Tournament", email: "student@email.com", date: "2026-06-01", description: "College-wide chess competition.", status: "Pending Review" }
        ];
        saveData(); // Save the seed data to localStorage immediately
    } else {
        events = storedEvents;
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        participants = JSON.parse(localStorage.getItem('participants')) || [];
        proposals = JSON.parse(localStorage.getItem('proposals')) || [];
    }

    updateEventSelects();
    updatePublicStats();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('participants', JSON.stringify(participants));
    localStorage.setItem('proposals', JSON.stringify(proposals));
    updatePublicStats();
}

function updatePublicStats() {
    const pEventsCount = document.getElementById('publicEventsCount');
    const pParticCount = document.getElementById('publicParticipantCount');
    if (pEventsCount) pEventsCount.innerText = events.length;
    if (pParticCount) pParticCount.innerText = participants.length;
}

// Switch Auth Tabs
function switchAuthTab(tab) {
    document.getElementById('tabParticipantLoginBtn').classList.remove('active');
    document.getElementById('tabCoordinatorLoginBtn').classList.remove('active');
    document.getElementById('tabPitchBtn').classList.remove('active');
    document.getElementById('participantLoginFormSection').classList.remove('active');
    document.getElementById('coordinatorLoginFormSection').classList.remove('active');
    document.getElementById('pitchFormSection').classList.remove('active');

    if (tab === 'participantLogin') {
        document.getElementById('tabParticipantLoginBtn').classList.add('active');
        document.getElementById('participantLoginFormSection').classList.add('active');
        document.getElementById('loginRoleState').value = 'participant'; 
    } else if (tab === 'coordinatorLogin') {
        document.getElementById('tabCoordinatorLoginBtn').classList.add('active');
        document.getElementById('coordinatorLoginFormSection').classList.add('active');
        document.getElementById('loginRoleState').value = 'coordinator';
    } else {
        document.getElementById('tabPitchBtn').classList.add('active');
        document.getElementById('pitchFormSection').classList.add('active');
    }
}

// Show Module
function showModule(moduleId, btnElement) {
    // Handle Nav Active state
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active-nav'));
    if (btnElement) {
        btnElement.classList.add('active-nav');
    }

    // Handle Module Visibility
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    let mod = document.getElementById(moduleId);
    if (mod) mod.classList.add('active');
    currentModule = moduleId;

    // Refresh specific module data
    if (moduleId === 'eventSchedule') displaySchedule();
    if (moduleId === 'executionTracking') displayTracking();
    if (moduleId === 'report') generateReport();
    if (moduleId === 'participantProposals') displayProposals();
    if (moduleId === 'participantEvents') displayAvailableEvents();
    if (moduleId === 'myRegistrations') displayMyRegistrations();
}

let currentUserRole = 'participant';
let currentUserEmail = '';

// Email Login
function login(role) {
    let emailId = role === 'coordinator' ? 'coordinatorEmail' : 'participantEmail';
    let passId = role === 'coordinator' ? 'coordinatorPassword' : 'participantPassword';
    let msgId = role === 'coordinator' ? 'coordinatorLoginMessage' : 'participantLoginMessage';
    
    let email = document.getElementById(emailId).value;
    let password = document.getElementById(passId).value;

    if (email && email.includes('@') && password) {
        processLogin(email, role);
    } else {
        document.getElementById(msgId).innerHTML = '<p style="color: var(--danger);"><i class="fas fa-exclamation-triangle"></i> Please enter a valid email and password.</p>';
    }
}

function processLogin(email, role, name = "") {
    isLoggedIn = true;
    currentUserRole = role;
    currentUserEmail = email;

    // Update user profile badge dynamically
    let badgeEmail = document.getElementById('badgeEmailText');
    if (badgeEmail) badgeEmail.innerText = email;
    
    let profilePageEmail = document.getElementById('profilePageEmail');
    if (profilePageEmail) profilePageEmail.innerText = email;
    let profileEmailInput = document.getElementById('profileEmail');
    if (profileEmailInput) profileEmailInput.value = email;
    
    if (name) {
        let profileNameDisplay = document.getElementById('profilePageNameDisplay');
        if (profileNameDisplay) profileNameDisplay.innerText = name;
        let profileNameInput = document.getElementById('profileName');
        if (profileNameInput) profileNameInput.value = name;
        
        let badgeNameText = document.getElementById('badgeNameText');
        if (badgeNameText) badgeNameText.innerText = name.split(' ')[0];
        
        let dropdownNameText = document.getElementById('dropdownNameText');
        if (dropdownNameText) dropdownNameText.innerText = name;
    } else {
        let defaultName = role === 'coordinator' ? 'Coordinator' : 'Participant';
        let badgeNameText = document.getElementById('badgeNameText');
        if (badgeNameText) badgeNameText.innerText = defaultName;
        
        let dropdownNameText = document.getElementById('dropdownNameText');
        if (dropdownNameText) dropdownNameText.innerText = defaultName;
        
        let profileNameDisplay = document.getElementById('profilePageNameDisplay');
        if (profileNameDisplay) profileNameDisplay.innerText = defaultName;
        
        let profileNameInput = document.getElementById('profileName');
        if (profileNameInput) profileNameInput.value = defaultName;
    }

    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // Setup Nav visibility based on role
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.classList.contains(role + '-nav')) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });

    // Default Module
    if (role === 'coordinator') {
        showModule('eventPlanning', document.querySelector('.coordinator-nav:nth-child(3)')); 
    } else {
        showModule('participantEvents', document.querySelector('.participant-nav.active-nav')); 
    }

    // Log the login to Supabase asynchronously without blocking UI
    if (supabaseClient) {
        try {
            supabaseClient
                .from('login_logs')
                .insert([{ email: email, role: role }])
                .then(({ error }) => {
                    if (error) console.error("Error saving login to Supabase:", error);
                })
                .catch(err => console.error("Supabase connection error:", err));
        } catch(e) {
            console.error("Supabase execution error:", e);
        }
    }
}

// Google Authentication Callback
function handleCredentialResponse(response) {
    const responsePayload = JSON.parse(atob(response.credential.split('.')[1]));
    let roleElement = document.getElementById('loginRoleState');
    let role = roleElement ? roleElement.value : 'participant';
    processLogin(responsePayload.email, role, responsePayload.name);
}

// Profile Menu Toggle
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'flex';
    } else {
        menu.style.display = 'none';
    }
}

// Close profile dropdown when clicking outside
window.addEventListener('click', function(e) {
    if (!e.target.closest('.admin-badge')) {
        const menu = document.getElementById('profileMenu');
        if (menu && menu.style.display === 'flex') {
            menu.style.display = 'none';
        }
    }
});

// Logout
function logout() {
    isLoggedIn = false;
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    
    // Ensure AI Assistant is closed upon returning to login screen
    let aiPanel = document.getElementById('aiAssistant');
    if (aiPanel) aiPanel.style.display = 'none';
    
    // Reset AI state so it starts fresh next login
    if (typeof aiState !== 'undefined') aiState = 'idle';
    if (typeof aiTempData !== 'undefined') aiTempData = {};
    
    // Clear the form fields safely
    let pEmailInput = document.getElementById('participantEmail');
    if (pEmailInput) pEmailInput.value = '';
    let pPwdInput = document.getElementById('participantPassword');
    if (pPwdInput) pPwdInput.value = '';
    let cEmailInput = document.getElementById('coordinatorEmail');
    if (cEmailInput) cEmailInput.value = '';
    let cPwdInput = document.getElementById('coordinatorPassword');
    if (cPwdInput) cPwdInput.value = '';
    
    let pMsg = document.getElementById('participantLoginMessage');
    if (pMsg) pMsg.innerHTML = '';
    let cMsg = document.getElementById('coordinatorLoginMessage');
    if (cMsg) cMsg.innerHTML = '';
    
    currentUserRole = 'participant';
    currentUserEmail = '';
}

// Participant Suggest Event (Public)
function submitPublicEvent() {
    let name = document.getElementById("publicEventName").value;
    let email = document.getElementById("publicOrganizerEmail").value;
    let date = document.getElementById("publicEventDate").value;
    let description = document.getElementById("publicEventDesc").value;

    if (!name || !email || !date || !description) {
        alert("Please fill all fields to suggest your event!");
        return;
    }

    proposals.push({
        id: Date.now(),
        name,
        email,
        date,
        description,
        status: 'Pending Review'
    });

    saveData();
    updateProposalCount();

    // Clear form
    document.getElementById("publicEventForm").reset();

    alert("Thank you! Your event suggestion has been submitted for review.");
}

function updateProposalCount() {
    const pending = proposals.filter(p => p.status === 'Pending Review').length;
    const badge = document.getElementById('proposalCount');
    if (badge) {
        badge.innerText = pending;
        badge.style.display = pending > 0 ? 'inline-block' : 'none';
    }
}

function displayProposals() {
    let list = document.getElementById("proposalsList");
    if (!list) return;
    list.innerHTML = "";

    const pendingProposals = proposals.filter(p => p.status === 'Pending Review');

    if (pendingProposals.length === 0) {
        list.innerHTML = "<p style='color: var(--text-muted); padding: 1rem 0;'>No pending event proposals right now.</p>";
        return;
    }

    pendingProposals.forEach((p) => {
        list.innerHTML += `
            <div class="card">
                <span class="badge pending"><i class="fas fa-clock"></i> Pending Review</span>
                <h4>${p.name}</h4>
                <p><strong><i class="fas fa-user"></i> Proposed by:</strong> ${p.email}</p>
                <p><strong><i class="fas fa-calendar"></i> Target Date:</strong> ${p.date}</p>
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
                    <p style="margin: 0;">${p.description}</p>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                    <button onclick="approveProposal(${p.id})" class="btn" style="flex:1; padding: 0.5rem;"><i class="fas fa-check"></i> Approve</button>
                    <button onclick="rejectProposal(${p.id})" class="btn btn-secondary" style="flex:1; padding: 0.5rem;"><i class="fas fa-times"></i> Reject</button>
                </div>
            </div>
        `;
    });
}

function approveProposal(id) {
    let proposal = proposals.find(p => p.id === id);
    if (proposal) {
        events.push({
            id: Date.now(),
            name: proposal.name,
            date: proposal.date,
            description: proposal.description + " (Student Proposal)"
        });

        proposals = proposals.filter(p => p.id !== id);

        saveData();
        updateEventSelects();
        updateProposalCount();
        displayProposals();
    }
}

function rejectProposal(id) {
    if (confirm("Are you sure you want to reject this event proposal?")) {
        proposals = proposals.filter(p => p.id !== id);
        saveData();
        updateProposalCount();
        displayProposals();
    }
}

// Add Event (Admin)
function addEvent() {
    let name = document.getElementById("eventName").value;
    let date = document.getElementById("eventDate").value;
    let description = document.getElementById("eventDescription").value;

    if (name === "" || date === "") {
        alert("Please fill all required fields");
        return;
    }

    events.push({ id: Date.now(), name, date, description });
    updateEventSelects();
    saveData();

    document.getElementById("eventName").value = "";
    document.getElementById("eventDate").value = "";
    document.getElementById("eventDescription").value = "";
    alert("Event Created successfully.");
}

// Add Task
function addTask() {
    let task = document.getElementById("taskName").value;
    let person = document.getElementById("assignedTo").value;
    let eventId = document.getElementById("taskEvent").value;

    if (task === "" || person === "" || eventId === "") {
        alert("Please fill all required fields");
        return;
    }

    tasks.push({ id: Date.now(), task, person, eventId, status: 'Pending' });
    saveData();

    document.getElementById("taskName").value = "";
    document.getElementById("assignedTo").value = "";
    document.getElementById("taskEvent").value = "";
    alert("Task Assigned.");
}

// Participant Actions
function displayAvailableEvents() {
    let list = document.getElementById("availableEventsList");
    if (!list) return;

    let search = document.getElementById("searchAvailableEvents")?.value.toLowerCase() || "";
    list.innerHTML = "";
    let filtered = events.filter(e => e.name.toLowerCase().includes(search) || e.description.toLowerCase().includes(search));

    if (filtered.length === 0) {
        list.innerHTML = "<p>No upcoming events available.</p>";
        return;
    }

    filtered.forEach((e) => {
        let isEnrolled = participants.some(p => p.email === currentUserEmail && p.eventId == e.id);
        
        let actionBtn = isEnrolled 
            ? `<button disabled class="btn btn-outline" style="color: var(--text-muted); border-color: var(--text-muted); cursor: not-allowed;"><i class="fas fa-check-circle"></i> Enrolled</button>`
            : `<button onclick="enrollEvent(${e.id})" class="btn"><i class="fas fa-sign-in-alt"></i> Join Event</button>`;

        list.innerHTML += `
            <div class="card">
                <h4><i class="fas fa-calendar-star" style="color: var(--primary);"></i> ${e.name}</h4>
                <p><i class="fas fa-clock" style="color: var(--secondary);"></i> ${e.date}</p>
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
                    <p style="margin:0;">${e.description}</p>
                </div>
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
                    ${actionBtn}
                </div>
            </div>
        `;
    });
}

function enrollEvent(eventId) {
    let name = document.getElementById('profileName')?.value || 'Participant';
    participants.push({ id: Date.now(), name: name, email: currentUserEmail, eventId: eventId });
    saveData();
    displayAvailableEvents();
    displayMyRegistrations();
    updatePublicStats();
    alert("Successfully enrolled in event!");
}

// Update Event Selects
function updateEventSelects() {
    let taskSelect = document.getElementById("taskEvent");
    let participantSelect = document.getElementById("participantEvent");
    if (!taskSelect || !participantSelect) return;

    taskSelect.innerHTML = '<option value="">Select Event</option>';
    participantSelect.innerHTML = '<option value="">Select Event</option>';
    events.forEach(e => {
        taskSelect.innerHTML += `<option value="${e.id}">${e.name}</option>`;
        participantSelect.innerHTML += `<option value="${e.id}">${e.name}</option>`;
    });
}

// Display Schedule
function displaySchedule() {
    let list = document.getElementById("scheduleList");
    if (!list) return;

    let search = document.getElementById("searchEvents").value.toLowerCase();
    list.innerHTML = "";
    let filtered = events.filter(e => e.name.toLowerCase().includes(search) || e.description.toLowerCase().includes(search));

    if (filtered.length === 0) list.innerHTML = "<p>No events found.</p>";

    filtered.forEach((e) => {
        list.innerHTML += `
            <div class="card">
                <h4><i class="fas fa-calendar-check" style="color: var(--primary);"></i> ${e.name}</h4>
                <p><i class="fas fa-clock" style="color: var(--secondary);"></i> ${e.date}</p>
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
                    <p style="margin:0;">${e.description}</p>
                </div>
                <button onclick="deleteEvent(${e.id})" class="delete-btn"><i class="fas fa-trash-alt"></i> Delete Event</button>
            </div>
        `;
    });
}

function filterEvents() {
    displaySchedule();
}

// Drag & Drop Kanban Logic
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev, taskId) {
    ev.dataTransfer.setData("taskId", taskId);
    setTimeout(() => {
        ev.target.classList.add('opacity-fade');
    }, 10);
}

function drop(ev, newStatus) {
    ev.preventDefault();
    let taskId = ev.dataTransfer.getData("taskId");
    let card = document.getElementById("taskCard-" + taskId);
    if (card) {
        card.classList.remove('opacity-fade');
    }
    if (taskId) {
        updateStatus(taskId, newStatus);
    }
}

// Display Tracking (Kanban)
function displayTracking() {
    const colPending = document.getElementById("col-Pending");
    const colInProgress = document.getElementById("col-InProgress");
    const colCompleted = document.getElementById("col-Completed");
    
    if (!colPending || !colInProgress || !colCompleted) return;

    colPending.innerHTML = "";
    colInProgress.innerHTML = "";
    colCompleted.innerHTML = "";

    if (tasks.length === 0) {
        colPending.innerHTML = "<p style='color: var(--text-muted);'>No active tasks.</p>";
    }

    tasks.forEach((t) => {
        let eventName = events.find(e => e.id == t.eventId)?.name || 'Unknown (Deleted)';
        let badgeClass = t.status === 'Pending' ? 'pending' : t.status === 'In Progress' ? 'in-progress' : 'completed';

        let uiHtml = `
            <div class="kanban-card" id="taskCard-${t.id}" draggable="true" ondragstart="drag(event, ${t.id})" ondragend="this.classList.remove('opacity-fade')">
                <span class="badge ${badgeClass}">${t.status}</span>
                <h4 style="color: var(--primary); margin: 0.5rem 0;">${t.task}</h4>
                <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 0.2rem;"><i class="fas fa-user-circle"></i> ${t.person}</p>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem;"><i class="fas fa-calendar"></i> ${eventName}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(57,255,20,0.1); padding-top: 0.8rem;">
                   <small style="color: var(--text-muted);"><i>Drag to move</i></small>
                   <button onclick="deleteTask(${t.id})" style="background: none; border: none; color: var(--danger); cursor: pointer;"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;

        if (t.status === 'Pending') colPending.innerHTML += uiHtml;
        else if (t.status === 'In Progress') colInProgress.innerHTML += uiHtml;
        else if (t.status === 'Completed') colCompleted.innerHTML += uiHtml;
    });
}

function displayMyRegistrations() {
    let list = document.getElementById("myRegistrationsList");
    if (!list) return;
    list.innerHTML = "";

    let myEnrollments = participants.filter(p => p.email === currentUserEmail);
    if (myEnrollments.length === 0) {
        list.innerHTML = "<p>You haven't joined any events yet.</p>";
        return;
    }

    myEnrollments.forEach((p) => {
        let e = events.find(ev => ev.id == p.eventId);
        if (e) {
            list.innerHTML += `
                <div class="card">
                    <h4><i class="fas fa-ticket-alt" style="color: var(--primary);"></i> ${e.name}</h4>
                    <p><i class="fas fa-clock" style="color: var(--secondary);"></i> ${e.date}</p>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
                        <p style="margin:0;">${e.description}</p>
                    </div>
                </div>
            `;
        }
    });
}

// Update Status
function updateStatus(taskId, status) {
    let task = tasks.find(t => t.id == taskId);
    if (task) {
        task.status = status;
        saveData();
        displayTracking();
    }
}

// Delete Event
function deleteEvent(id) {
    if (confirm("Are you sure you want to delete this event? This will also remove all associated tasks and participants.")) {
        events = events.filter(e => e.id != id);
        tasks = tasks.filter(t => t.eventId != id);
        participants = participants.filter(p => p.eventId != id);
        updateEventSelects();
        saveData();
        displaySchedule();
    }
}

// Delete Task
function deleteTask(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        tasks = tasks.filter(t => t.id != id);
        saveData();
        displayTracking();
    }
}

// Display Report
let reportChart = null;

function generateReport() {
    let content = document.getElementById("reportContent");
    if (!content) return;

    let completedTasks = tasks.filter(t => t.status === 'Completed').length;
    let pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    let inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;

    content.innerHTML = `
        <div class="card" style="text-align: center;">
            <i class="fas fa-calendar" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;"></i>
            <h2>${events.length}</h2>
            <p>Active Events</p>
        </div>
        <div class="card" style="text-align: center;">
            <i class="fas fa-users" style="font-size: 3rem; color: var(--secondary); margin-bottom: 1rem;"></i>
            <h2>${participants.length}</h2>
            <p>Registered Participants</p>
        </div>
        <div class="card" style="text-align: center;">
            <i class="fas fa-tasks" style="font-size: 3rem; color: #00c853; margin-bottom: 1rem;"></i>
            <h2>${completedTasks} / ${tasks.length}</h2>
            <p>Tasks Completed</p>
        </div>
    `;

    // Render Pie Chart
    const ctx = document.getElementById('taskPieChart');
    if (ctx) {
        if (reportChart) {
            reportChart.destroy();
        }

        // Colors matching Theme
        const colorCompleted = '#39ff14'; // Primary Green
        const colorInProgress = '#00b4d8'; // Neon Blue/Cyan
        const colorPending = '#ffaa00'; // Warning Orange

        reportChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Completed', 'In Progress', 'Pending'],
                datasets: [{
                    data: [completedTasks, inProgressTasks, pendingTasks],
                    backgroundColor: [colorCompleted, colorInProgress, colorPending],
                    borderColor: '#050505',
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            font: { size: 14, family: 'Outfit' },
                            padding: 20
                        }
                    }
                }
            }
        });
    }
}

// Update Profile
function updateProfile() {
    let newName = document.getElementById('profileName').value;
    let newEmail = document.getElementById('profileEmail').value;

    if (!newName || !newEmail) {
        alert("Name and email are required!");
        return;
    }

    // Update display in badge and profile
    let badgeEmail = document.getElementById('badgeEmailText');
    if (badgeEmail) badgeEmail.innerText = newEmail;
    
    let profilePageEmail = document.getElementById('profilePageEmail');
    if (profilePageEmail) profilePageEmail.innerText = newEmail;
    
    let profilePageNameDisplay = document.getElementById('profilePageNameDisplay');
    if (profilePageNameDisplay) profilePageNameDisplay.innerText = newName;
    
    let badgeNameText = document.getElementById('badgeNameText');
    if (badgeNameText) badgeNameText.innerText = newName.split(' ')[0]; // Show first name
    
    let dropdownNameText = document.getElementById('dropdownNameText');
    if (dropdownNameText) dropdownNameText.innerText = newName;

    let pwd = document.getElementById('profilePassword');
    if (pwd) pwd.value = '';

    alert('Profile updated successfully!');
}

// ------------------------------------------
// AI ASSISTANT LOGIC
// ------------------------------------------

let aiState = 'idle';
let aiTempData = {};

function toggleAIAssistant() {
    let aiPanel = document.getElementById('aiAssistant');
    if (aiPanel.style.display === 'none' || aiPanel.style.display === '') {
        aiPanel.style.display = 'block';
        document.getElementById('aiInput').focus();
    } else {
        aiPanel.style.display = 'none';
        // Reset state on close
        aiState = 'idle';
        aiTempData = {};
    }
}

function processAIInput() {
    let inputEl = document.getElementById("aiInput");
    let text = inputEl.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputEl.value = "";

    // Simulate AI processing delay
    setTimeout(() => {
        let response = generateAIResponse(text.toLowerCase());
        appendMessage('ai', response);
    }, 600);
}

function appendMessage(sender, text) {
    let chat = document.getElementById("aiChatWindow");
    let div = document.createElement("div");
    div.style.padding = "0.6rem 0.8rem";
    div.style.borderRadius = "8px";
    div.style.maxWidth = "85%";
    div.style.fontSize = "0.95rem";
    div.style.lineHeight = "1.4";

    if (sender === 'user') {
        div.style.background = "var(--primary)";
        div.style.color = "#000";
        div.style.alignSelf = "flex-end";
        div.style.fontWeight = "600";
    } else {
        div.style.background = "rgba(0,15,0,0.8)";
        div.style.border = "1px solid var(--glass-border)";
        div.style.color = "#fff";
        div.style.alignSelf = "flex-start";
    }
    div.innerHTML = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function generateAIResponse(text) {
    // Universal escape hatch
    if (text === 'cancel' || text === 'exit' || text === 'quit' || text === '0') {
        aiState = 'idle';
        aiTempData = {};
        return "Action cancelled. <br>Reply with a number:<br><b>1</b> - List Events<br><b>2</b> - Enroll Participant<br><b>3</b> - System Report";
    }

    if (aiState === 'idle') {
        if (text === '1' || text.includes("event") || text.includes("list")) {
            if (events.length === 0) return "There are currently no events scheduled.";
            let list = events.map(e => `• <b>${e.name}</b> (${e.date})`).join("<br>");
            return "<b>Current Event Schedule:</b><br><br>" + list;
        }
        else if (text === '2' || text.includes("enroll") || text.includes("register")) {
            aiState = 'awaiting_name';
            return "Great! Let's get them enrolled step-by-step.<br><br>First, what is the participant's <b>Full Name</b>?";
        }
        else if (text === '3' || text.includes("report") || text.includes("status")) {
            let completedTasks = tasks.filter(t => t.status === 'Completed').length;
            return `<b>Quick Live Report:</b><br>• ${events.length} Active Events<br>• ${participants.length} Registered Participants<br>• ${completedTasks} / ${tasks.length} Tasks Completed`;
        }
        else {
            return "I didn't quite catch that. Please reply with a number:<br><br><b>1</b> - List Events<br><b>2</b> - Enroll Participant<br><b>3</b> - View Quick Report";
        }
    }

    if (aiState === 'awaiting_name') {
        if (text.length < 2) return "That name looks too short. Please enter a valid name, or type <b>cancel</b> to abort.";

        let words = text.split(" ").filter(w => w.length > 0);
        aiTempData.name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

        aiState = 'awaiting_email';
        return `Nice to meet you, <b>${aiTempData.name}</b>! <br><br>Next step: What is their <b>Email Address</b>?`;
    }

    if (aiState === 'awaiting_email') {
        let emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/);
        if (!emailMatch) return "That doesn't look like a valid email. Please try again, or type <b>cancel</b> to abort.";

        aiTempData.email = emailMatch[0];
        aiState = 'awaiting_event';

        let list = events.map(e => `• <b>${e.name}</b>`).join("<br>");
        return `Got it! Lastly, which event should I enroll them in? Here are the options:<br><br>${list}<br><br><i>(Type the full or partial name of the event)</i>`;
    }

    if (aiState === 'awaiting_event') {
        let foundEvent = events.find(e => e.name.toLowerCase().includes(text));

        if (foundEvent) {
            participants.push({ id: Date.now(), name: aiTempData.name, email: aiTempData.email, eventId: foundEvent.id });
            saveData();
            if (currentModule === 'participantRegistration') displayRoster();
            updatePublicStats();

            aiState = 'idle';
            return `🎉 <b>Enrollment Successful!</b><br>I have officially registered <b>${aiTempData.name}</b> for <b>${foundEvent.name}</b>.<br><br>Type 1, 2, or 3 for more options.`;
        } else {
            return "I couldn't identify that event. Please check the spelling from the list above and try again, or type <b>cancel</b> to abort.";
        }
    }
}

// ------------------------------------------
// BACKGROUND ANIMATION LOGIC
// ------------------------------------------
function initBackgroundAnimation() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Mouse Interaction
    let mouse = {
        x: null,
        y: null,
        radius: 150
    };

    window.addEventListener('mousemove', function(event) {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('mouseout', function() {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            // Slightly reduced velocity so repulsion is more visible
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 2 + 1.5;
        }
        update() {
            // Apply normal velocity
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges smoothly
            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;

            // Mouse interaction (Attraction effect)
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    // Ease the force so it doesn't snap suddenly
                    const force = (mouse.radius - distance) / mouse.radius;
                    const attractionStrength = 3; 

                    this.x += forceDirectionX * force * attractionStrength;
                    this.y += forceDirectionY * force * attractionStrength;
                }
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(57, 255, 20, 0.6)';
            ctx.fill();
        }
    }

    // Adjust particle count based on screen size for performance
    const particleCount = Math.floor((width * height) / 10000);
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            
            // Connect lines from particles to cursor
            if (mouse.x != null && mouse.y != null) {
                const dxMouse = particles[i].x - mouse.x;
                const dyMouse = particles[i].y - mouse.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                
                if (distMouse < mouse.radius) {
                    ctx.beginPath();
                    // Cursor acts like a node connecting to nearby particles
                    ctx.strokeStyle = `rgba(57, 255, 20, ${0.6 - distMouse / (mouse.radius * 1.5)})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }

            // Connect lines between particles themselves
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 130) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(57, 255, 20, ${0.4 - distance / 325})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}