import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { deleteExpense } from '../service/expenseApi';

const ExpenseList = ({ expenses, onExpenseDeleted, categories, selectedCategory, onCategoryChange }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    setDeletingId(expenseId);
    try {
      await deleteExpense(expenseId);
      toast.success('Expense deleted successfully');
      onExpenseDeleted(expenseId);
    } catch (error) {
      toast.error('Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-IN', {  
    style: 'currency',
    currency: 'INR'  
  }).format(amount);
};


  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedCategory === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => onCategoryChange(cat.category)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedCategory === cat.category
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat.category} ({cat.count})
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
            <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first expense.
            </p>
        </div>

        ) : (
          <ul className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <li key={expense.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {formatAmount(expense.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                        {expense.category}
                      </span>
                      <time dateTime={expense.created_at}>
                        {formatDate(expense.created_at)}
                      </time>
                    </div>
                    {expense.original_prompt && (
                      <p className="mt-1 text-xs text-gray-400 italic">
                        "{expense.original_prompt}"
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deletingId === expense.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deletingId === expense.id ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
