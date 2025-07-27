import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/Authcontext';
import { fetchExpenses, fetchCategories, fetchMonthlySummary } from '../service/expenseApi';
import AddExpenseModal from './AddExpenseModal';
import ExpenseList from './ExpenseList';
import ExpenseSummary from './ExpenseSummary';
import MonthFilter from './MonthFilter';

const Dashboard = () => {
  const { logout } = useAuth(); // Only destructure what's available
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to get username from localStorage or token
        const username = getUsernameFromStorage();
        setUser({ username });

        const [expensesData, categoriesData, summaryData] = await Promise.all([
          fetchExpenses({ year: selectedYear }),
          fetchCategories(),
          fetchMonthlySummary(selectedYear)
        ]);
        
        setExpenses(expensesData);
        setCategories(categoriesData);
        setMonthlySummary(summaryData);
      } catch (error) {
        toast.error('Failed to load data');
        setUser({ username: 'User' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to get username from localStorage or decode from token
  const getUsernameFromStorage = () => {
    // Try to get username from localStorage first
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      return storedUsername;
    }

    // If not in localStorage, try to decode from token (if it's JWT)
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.username || payload.sub || 'User';
      }
    } catch (error) {
      console.log('Could not decode token');
    }

    return 'User';
  };

  const loadExpenses = async () => {
    setExpensesLoading(true);
    try {
      const filters = {};
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedMonth) filters.month = selectedMonth;
      if (selectedYear) filters.year = selectedYear;
      
      const expensesData = await fetchExpenses(filters);
      setExpenses(expensesData);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadExpenses();
    }
  }, [selectedCategory, selectedMonth, selectedYear]);

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (!year) {
      setSelectedMonth(null);
    }
  };

  const handleExpenseDeleted = async (expenseId) => {
    setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    try {
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to reload categories');
    }
  };

  const handleExpenseAdded = async (newExpense) => {
    setExpenses(prev => [newExpense, ...prev]);
    try {
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to reload categories');
    }
  };

  const handleLogout = () => {
    // Clear username from localStorage on logout
    localStorage.removeItem('username');
    logout();
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                <span className="hidden sm:inline">Expense Tracker</span>
                <span className="sm:hidden">Expenses</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center"
              >
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline ml-1">Add Expense</span>
                <span className="sm:hidden ml-1">Add</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          <ExpenseSummary expenses={expenses} categories={categories} />
          
          <MonthFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
          />
          
          {expensesLoading ? (
            <div className="flex justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <ExpenseList
              expenses={expenses}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onExpenseDeleted={handleExpenseDeleted}
            />
          )}
        </div>
      </main>

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExpenseAdded={handleExpenseAdded}
      />
    </div>
  );
};

export default Dashboard;
