import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
export function SupplierLogin() {
  const navigate = useNavigate();
  const {
    suppliers,
    setCurrentUser
  } = useApp();
  const [email, setEmail] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.email === email);
    if (supplier) {
      setCurrentUser({
        id: supplier.id,
        role: 'supplier'
      });
      navigate('/supplier/dashboard');
    } else {
      alert('Supplier not found. Please check your email or register.');
    }
  };
  return <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-md mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">
            Supplier Login
          </h1>
          <p className="text-neutral-600">
            Enter your email to access your account
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Login
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>;
}