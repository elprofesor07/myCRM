import { createApi } from '@reduxjs/toolkit/query/react';
import { baseApi, buildQueryParams, transformPaginatedResponse } from './baseApi';

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get contacts list
    getContacts: builder.query({
      query: ({ filters = {}, pagination = { page: 1, limit: 20 } }) => {
        const queryString = buildQueryParams(filters, pagination);
        return `/contacts${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: transformPaginatedResponse,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Contact', id: _id })),
              { type: 'Contact', id: 'LIST' },
            ]
          : [{ type: 'Contact', id: 'LIST' }],
    }),

    // Get contact by ID
    getContact: builder.query({
      query: (id) => `/contacts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Contact', id }],
    }),

    // Create contact
    createContact: builder.mutation({
      query: (contactData) => ({
        url: '/contacts',
        method: 'POST',
        body: contactData,
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    // Update contact
    updateContact: builder.mutation({
      query: ({ id, ...contactData }) => ({
        url: `/contacts/${id}`,
        method: 'PUT',
        body: contactData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contact', id },
        { type: 'Contact', id: 'LIST' },
      ],
    }),

    // Delete contact
    deleteContact: builder.mutation({
      query: (id) => ({
        url: `/contacts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Contact', id },
        { type: 'Contact', id: 'LIST' },
      ],
    }),

    // Bulk delete contacts
    bulkDeleteContacts: builder.mutation({
      query: (ids) => ({
        url: '/contacts/bulk-delete',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    // Import contacts
    importContacts: builder.mutation({
      query: (formData) => ({
        url: '/contacts/import',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    // Export contacts
    exportContacts: builder.query({
      query: (filters = {}) => {
        const queryString = buildQueryParams(filters);
        return `/contacts/export${queryString ? `?${queryString}` : ''}`;
      },
    }),

    // Get contact activities
    getContactActivities: builder.query({
      query: ({ id, pagination = { page: 1, limit: 10 } }) => {
        const queryString = buildQueryParams({}, pagination);
        return `/contacts/${id}/activities${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: transformPaginatedResponse,
      providesTags: (result, error, { id }) => [
        { type: 'Contact', id },
        { type: 'Activity', id: 'LIST' },
      ],
    }),

    // Get contact deals
    getContactDeals: builder.query({
      query: (id) => `/contacts/${id}/deals`,
      providesTags: (result, error, id) => [
        { type: 'Contact', id },
        { type: 'Deal', id: 'LIST' },
      ],
    }),

    // Add note to contact
    addContactNote: builder.mutation({
      query: ({ id, note }) => ({
        url: `/contacts/${id}/notes`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contact', id },
        { type: 'Activity', id: 'LIST' },
      ],
    }),

    // Update contact status
    updateContactStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/contacts/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contact', id },
        { type: 'Contact', id: 'LIST' },
      ],
    }),

    // Merge contacts
    mergeContacts: builder.mutation({
      query: ({ primaryId, mergeIds }) => ({
        url: `/contacts/${primaryId}/merge`,
        method: 'POST',
        body: { mergeIds },
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    // Get contact duplicates
    getContactDuplicates: builder.query({
      query: (email) => `/contacts/duplicates?email=${encodeURIComponent(email)}`,
    }),

    // Convert contact to customer
    convertToCustomer: builder.mutation({
      query: (id) => ({
        url: `/contacts/${id}/convert-to-customer`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Contact', id },
        { type: 'Contact', id: 'LIST' },
      ],
    }),

    // Get contact statistics
    getContactStats: builder.query({
      query: () => '/contacts/stats',
      providesTags: ['Dashboard'],
    }),

    // Search contacts
    searchContacts: builder.query({
      query: (query) => `/contacts/search?q=${encodeURIComponent(query)}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Contact', id: _id })),
              { type: 'Contact', id: 'SEARCH' },
            ]
          : [{ type: 'Contact', id: 'SEARCH' }],
    }),
  }),
});

export const {
  useGetContactsQuery,
  useGetContactQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useBulkDeleteContactsMutation,
  useImportContactsMutation,
  useExportContactsQuery,
  useGetContactActivitiesQuery,
  useGetContactDealsQuery,
  useAddContactNoteMutation,
  useUpdateContactStatusMutation,
  useMergeContactsMutation,
  useGetContactDuplicatesQuery,
  useConvertToCustomerMutation,
  useGetContactStatsQuery,
  useSearchContactsQuery,
} = contactApi;