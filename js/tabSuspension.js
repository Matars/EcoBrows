// tabSuspension.js

const TabSuspension = {
    INACTIVITY_THRESHOLD: 20 * 1000, // 20 seconds för test (adjust as needed)
    suspendedTabs: new Set(),
    tabTimers: {},
    tabLastActive: {},
    isEnabled: false,
    currentActiveTabId: null,
  
    init: function() {
        console.log("TabSuspension init called");
        chrome.storage.sync.get(["tabSuspensionEnabled"], (data) => {
            this.isEnabled = data.tabSuspensionEnabled || false;
            console.log("TabSuspension isEnabled:", this.isEnabled);
            if (this.isEnabled) {
                this.setupListeners();
                this.getCurrentActiveTab();
            }
        });
    },
  
    setupListeners: function() {
        console.log("Setting up TabSuspension listeners");
        chrome.tabs.onActivated.addListener(this.onTabActivated.bind(this));
        chrome.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));
        chrome.tabs.onRemoved.addListener(this.onTabRemoved.bind(this));
        chrome.webNavigation.onCompleted.addListener(this.onNavigationCompleted.bind(this));
        chrome.windows.onFocusChanged.addListener(this.onWindowFocusChanged.bind(this));
    },
  
    removeListeners: function() {
        console.log("Removing TabSuspension listeners");
        chrome.tabs.onActivated.removeListener(this.onTabActivated.bind(this));
        chrome.tabs.onUpdated.removeListener(this.onTabUpdated.bind(this));
        chrome.tabs.onRemoved.removeListener(this.onTabRemoved.bind(this));
        chrome.webNavigation.onCompleted.removeListener(this.onNavigationCompleted.bind(this));
        chrome.windows.onFocusChanged.removeListener(this.onWindowFocusChanged.bind(this));
    },
  
    onTabActivated: function(activeInfo) {
        console.log("Tab activated:", activeInfo.tabId);
        this.currentActiveTabId = activeInfo.tabId;
        this.resetTabTimer(activeInfo.tabId);
    },
  
    onTabUpdated: function(tabId, changeInfo, tab) {
        if (changeInfo.status === "complete") {
            console.log("Tab updated:", tabId);
            this.resetTabTimer(tabId);
        }
    },
  
    onTabRemoved: function(tabId) {
        console.log("Tab removed:", tabId);
        this.clearTabTimer(tabId);
        this.suspendedTabs.delete(tabId);
        delete this.tabLastActive[tabId];
        if (this.currentActiveTabId === tabId) {
            this.currentActiveTabId = null;
            this.getCurrentActiveTab();
        }
    },

    onNavigationCompleted: function(details) {
        if (details.frameId === 0) {  // Main frame only
            this.resetTabTimer(details.tabId);
        }
    },

    onWindowFocusChanged: function(windowId) {
        if (windowId !== chrome.windows.WINDOW_ID_NONE) {
            this.getCurrentActiveTab();
        } else {
            this.currentActiveTabId = null;
        }
    },

    getCurrentActiveTab: function() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                this.currentActiveTabId = tabs[0].id;
                this.resetTabTimer(this.currentActiveTabId);
            }
        });
    },
  
    clearTabTimer: function(tabId) {
        clearTimeout(this.tabTimers[tabId]);
        delete this.tabTimers[tabId];
    },
  
    resetTabTimer: function(tabId) {
        this.clearTabTimer(tabId);
        this.tabLastActive[tabId] = Date.now();
        if (this.isEnabled && tabId !== this.currentActiveTabId) {
            this.startTabTimer(tabId);
        }
    },
  
    startTabTimer: function(tabId) {
        console.log("Starting timer for tab:", tabId);
        this.tabTimers[tabId] = setTimeout(() => this.checkTabForSuspension(tabId), this.INACTIVITY_THRESHOLD);
    },
  
    checkTabForSuspension: function(tabId) {
        if (tabId === this.currentActiveTabId) {
            console.log("Tab is currently active, not suspending:", tabId);
            return;
        }

        chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
                return;
            }
            
            // Check if the tab is audible (e.g., playing video or audio)
            if (tab.audible) {
                console.log("Tab is audible, not suspending:", tabId);
                this.resetTabTimer(tabId);
                return;
            }
            
            // Check if the tab has been inactive for the threshold duration
            const inactiveDuration = Date.now() - this.tabLastActive[tabId];
            if (inactiveDuration >= this.INACTIVITY_THRESHOLD) {
                this.suspendTab(tabId);
            } else {
                // If not, set a new timer for the remaining time
                const remainingTime = this.INACTIVITY_THRESHOLD - inactiveDuration;
                this.tabTimers[tabId] = setTimeout(() => this.checkTabForSuspension(tabId), remainingTime);
            }
        });
    },
  
    suspendTab: function(tabId) {
        console.log("Suspending tab:", tabId);
        this.suspendedTabs.add(tabId);
        chrome.tabs.discard(tabId);
    },
  
    toggleSuspension: function(enabled) {
        console.log("Toggling tab suspension:", enabled);
        this.isEnabled = enabled;
        if (enabled) {
            this.setupListeners();
            this.getCurrentActiveTab();
            // Start timers for all existing tabs except the active one
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.id !== this.currentActiveTabId) {
                        this.resetTabTimer(tab.id);
                    }
                });
            });
        } else {
            this.removeListeners();
            // Clear all existing timers
            Object.values(this.tabTimers).forEach(clearTimeout);
            this.tabTimers = {};
            this.suspendedTabs.clear();
            this.tabLastActive = {};
            this.currentActiveTabId = null;
        }
        chrome.storage.sync.set({ tabSuspensionEnabled: enabled });
    }
};

// Make sure TabSuspension is available globally
if (typeof self !== 'undefined') {
    self.TabSuspension = TabSuspension;
} else {
    console.error("Unable to export TabSuspension object");
}

console.log("tabSuspension.js loaded");