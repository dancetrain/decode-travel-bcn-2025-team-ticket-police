import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
export function HomePage() {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-semibold text-neutral-900 mb-4">
            TicketHub
          </h1>
          <p className="text-xl text-neutral-600">B2B Ticket Purchase System</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                  Supplier
                </h2>
                <p className="text-neutral-600">
                  Issue and manage tickets for your events
                </p>
              </div>

              <div className="space-y-3">
                <Button className="w-full" onClick={() => navigate('/supplier/register')}>
                  Create Supplier Account
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/supplier/login')}>
                  Supplier Login
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                  Distributor
                </h2>
                <p className="text-neutral-600">
                  Purchase and resell tickets from suppliers
                </p>
              </div>

              <div className="space-y-3">
                <Button className="w-full" onClick={() => navigate('/distributor/register')}>
                  Create Distributor Account
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/distributor/login')}>
                  Distributor Login
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>;
}