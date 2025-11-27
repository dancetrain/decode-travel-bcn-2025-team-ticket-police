import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
export function SupplierRegistration() {
  const navigate = useNavigate();
  const {
    addSupplier,
    setCurrentUser
  } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: ''
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = addSupplier(formData);
    setCurrentUser({
      id,
      role: 'supplier'
    });
    navigate('/supplier/dashboard');
  };
  return <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">
            Create Supplier Account
          </h1>
          <p className="text-neutral-600">Register to start issuing tickets</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Full Name" type="text" required value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} />

            <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} />

            <Input label="Company Name" type="text" required value={formData.company} onChange={e => setFormData({
            ...formData,
            company: e.target.value
          })} />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Create Account
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