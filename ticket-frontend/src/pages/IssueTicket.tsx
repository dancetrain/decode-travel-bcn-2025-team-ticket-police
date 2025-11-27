import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Card } from '../components/Card';
export function IssueTicket() {
  const navigate = useNavigate();
  const {
    addTicket,
    currentUser,
    suppliers
  } = useApp();
  const [formData, setFormData] = useState({
    ticketName: '',
    venue: '',
    eventDate: '',
    price: '',
    description: '',
    rules: '{}',
    status: 'Available' as const,
    quantity: ''
  });
  const supplier = suppliers.find(s => s.id === currentUser?.id);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedRules = {};
    try {
      parsedRules = JSON.parse(formData.rules);
    } catch (error) {
      alert('Invalid JSON format for rules');
      return;
    }
    addTicket({
      ticketName: formData.ticketName,
      venue: formData.venue,
      eventDate: formData.eventDate,
      price: parseFloat(formData.price),
      description: formData.description,
      rules: parsedRules,
      status: formData.status,
      quantity: parseInt(formData.quantity),
      supplierId: currentUser!.id,
      supplierName: supplier?.name || ''
    });
    navigate('/supplier/dashboard');
  };
  return <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">
            Issue New Ticket
          </h1>
          <p className="text-neutral-600">Create tickets for your event</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Ticket Name" type="text" required value={formData.ticketName} onChange={e => setFormData({
            ...formData,
            ticketName: e.target.value
          })} placeholder="e.g., VIP Access Pass" />

            <Input label="Venue" type="text" required value={formData.venue} onChange={e => setFormData({
            ...formData,
            venue: e.target.value
          })} placeholder="e.g., Madison Square Garden" />

            <Input label="Event Date" type="date" required value={formData.eventDate} onChange={e => setFormData({
            ...formData,
            eventDate: e.target.value
          })} />

            <div className="grid grid-cols-2 gap-6">
              <Input label="Price ($)" type="number" step="0.01" required value={formData.price} onChange={e => setFormData({
              ...formData,
              price: e.target.value
            })} placeholder="99.99" />

              <Input label="Quantity" type="number" required value={formData.quantity} onChange={e => setFormData({
              ...formData,
              quantity: e.target.value
            })} placeholder="100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description
              </label>
              <textarea className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition-all" rows={4} value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} placeholder="Describe the ticket benefits and details..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Rules (JSON)
              </label>
              <textarea className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition-all font-mono text-sm" rows={4} value={formData.rules} onChange={e => setFormData({
              ...formData,
              rules: e.target.value
            })} placeholder='{"refundable": true, "transferable": false}' />
            </div>

            <Select label="Status" options={[{
            value: 'Available',
            label: 'Available'
          }, {
            value: 'Sold',
            label: 'Sold'
          }, {
            value: 'Available for Resale',
            label: 'Available for Resale'
          }, {
            value: 'Cancelled',
            label: 'Cancelled'
          }]} value={formData.status} onChange={e => setFormData({
            ...formData,
            status: e.target.value as any
          })} />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Issue Ticket
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/supplier/dashboard')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>;
}