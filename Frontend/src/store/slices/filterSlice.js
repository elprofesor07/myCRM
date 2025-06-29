import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  contacts: {
    search: '',
    status: [],
    source: [],
    tags: [],
    owner: null,
    company: null,
    dateRange: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  companies: {
    search: '',
    type: [],
    industry: [],
    size: [],
    tags: [],
    owner: null,
    dateRange: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  deals: {
    search: '',
    stage: [],
    pipeline: 'default',
    priority: [],
    owner: null,
    company: null,
    dateRange: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  tasks: {
    search: '',
    status: [],
    priority: [],
    type: [],
    assignee: null,
    project: null,
    labels: [],
    dueDate: null,
    sortBy: 'dueDate',
    sortOrder: 'asc',
  },
  activities: {
    search: '',
    type: [],
    status: [],
    relatedToModel: null,
    owner: null,
    dateRange: null,
    sortBy: 'scheduledStart',
    sortOrder: 'desc',
  },
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { entity, field, value } = action.payload;
      if (state[entity]) {
        state[entity][field] = value;
      }
    },
    setFilters: (state, action) => {
      const { entity, filters } = action.payload;
      if (state[entity]) {
        state[entity] = { ...state[entity], ...filters };
      }
    },
    resetFilter: (state, action) => {
      const { entity, field } = action.payload;
      if (state[entity] && initialState[entity][field] !== undefined) {
        state[entity][field] = initialState[entity][field];
      }
    },
    resetEntityFilters: (state, action) => {
      const entity = action.payload;
      if (state[entity]) {
        state[entity] = initialState[entity];
      }
    },
    resetAllFilters: (state) => {
      return initialState;
    },
    toggleArrayFilter: (state, action) => {
      const { entity, field, value } = action.payload;
      if (state[entity] && Array.isArray(state[entity][field])) {
        const index = state[entity][field].indexOf(value);
        if (index > -1) {
          state[entity][field].splice(index, 1);
        } else {
          state[entity][field].push(value);
        }
      }
    },
    setSorting: (state, action) => {
      const { entity, sortBy, sortOrder } = action.payload;
      if (state[entity]) {
        state[entity].sortBy = sortBy;
        state[entity].sortOrder = sortOrder;
      }
    },
    loadSavedFilters: (state) => {
      const savedFilters = localStorage.getItem('crmFilters');
      if (savedFilters) {
        try {
          const parsed = JSON.parse(savedFilters);
          return { ...state, ...parsed };
        } catch (e) {
          console.error('Failed to load saved filters:', e);
        }
      }
    },
    saveFilters: (state) => {
      localStorage.setItem('crmFilters', JSON.stringify(state));
    },
  },
});

export const {
  setFilter,
  setFilters,
  resetFilter,
  resetEntityFilters,
  resetAllFilters,
  toggleArrayFilter,
  setSorting,
  loadSavedFilters,
  saveFilters,
} = filterSlice.actions;

// Selectors
export const selectContactFilters = (state) => state.filters.contacts;
export const selectCompanyFilters = (state) => state.filters.companies;
export const selectDealFilters = (state) => state.filters.deals;
export const selectTaskFilters = (state) => state.filters.tasks;
export const selectActivityFilters = (state) => state.filters.activities;

export const selectEntityFilters = (entity) => (state) => state.filters[entity];

// Helper selectors
export const selectActiveFiltersCount = (entity) => (state) => {
  const filters = state.filters[entity];
  if (!filters) return 0;

  let count = 0;
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'sortBy' || key === 'sortOrder') return;
    
    if (Array.isArray(value) && value.length > 0) {
      count += value.length;
    } else if (value && typeof value === 'string' && value.trim() !== '') {
      count++;
    } else if (value && typeof value === 'object') {
      count++;
    }
  });
  
  return count;
};

export default filterSlice.reducer;