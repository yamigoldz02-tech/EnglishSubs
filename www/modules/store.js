// @ts-check
// @AI-SECTION: APP_STORE
/// <reference path="./types.js" />
// Централизованное хранилище данных (Store)
export const store = {
  personalDictionary: [],
  currentUser: null,
  
  loadDictionary() {
    try {
      const saved = localStorage.getItem('my_personal_dictionary');
      if (saved) {
        this.personalDictionary = JSON.parse(saved);
      }
    } catch (e) {
      this.personalDictionary = [];
    }
    return this.personalDictionary;
  },

  saveDictionary() {
    localStorage.setItem('my_personal_dictionary', JSON.stringify(this.personalDictionary));
  },

  syncToWindow() {
    window.personalDictionary = this.personalDictionary;
    window.currentUser = this.currentUser;
  }
};

store.loadDictionary();
store.syncToWindow();
window.AppStore = store;

