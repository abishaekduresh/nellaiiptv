'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Server, Shield, Globe, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description?: string;
  protected?: boolean;
  admin?: boolean;
  payload?: any;
  queryParams?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  response: any;
}

interface Category {
  name: string;
  endpoints: Endpoint[];
}

const apiData: Category[] = [
  {
    name: "Authentication",
    endpoints: [
      {
        method: "POST",
        path: "/customers/register",
        title: "Register User",
        description: "Register a new customer account.",
        headers: {
            "X-API-KEY": "YOUR_API_KEY",
            "X-Client-Platform": "android"
        },
        payload: {
          "name": "John Doe",
          "phone": "1234567890",
          "email": "john@example.com",
          "password": "password123"
        },
        response: {
          "status": true,
          "message": "Registration successful. Please login.",
          "data": { "uuid": "..." }
        }
      },
      {
        method: "POST",
        path: "/customers/login",
        title: "Login",
        headers: {
            "X-API-KEY": "YOUR_API_KEY"
        },
        payload: {
          "phone": "1234567890",
          "password": "password123"
        },
        response: {
          "status": true,
          "message": "Login successful",
          "data": { "token": "...", "user": { "name": "..." } }
        }
      }
    ]
  },
  {
    name: "Channels",
    endpoints: [
      {
        method: "GET",
        path: "/channels",
        title: "List Channels",
        description: "Get a paginated list of channels.",
        headers: {
            "X-API-KEY": "YOUR_API_KEY",
            "X-Client-Platform": "web"
        },
        queryParams: {
            "limit": 50,
            "page": 1,
            "sort": "top_daily",
            "search": "news"
        },
        response: {
          "status": true,
          "data": {
            "data": [{ "name": "Channel Name", "hls_url": "..." }],
            "total": 100
          }
        }
      },
      {
        method: "GET",
        path: "/channels/{uuid}",
        title: "Get Channel Details",
        headers: {
            "X-API-KEY": "YOUR_API_KEY"
        },
        response: {
          "status": true,
          "data": { "name": "Channel Name", "viewers_count": 150 }
        }
      }
    ]
  },
  {
    name: "Customer Profile",
    endpoints: [
      {
        method: "GET",
        path: "/customers/profile",
        title: "Get Profile",
        protected: true,
        headers: {
            "X-API-KEY": "YOUR_API_KEY",
            "Authorization": "Bearer <YOUR_TOKEN>"
        },
        response: {
          "status": true,
          "data": { "name": "John Doe", "phone": "..." }
        }
      },
      {
        method: "PUT",
        path: "/customers/profile",
        title: "Update Profile",
        protected: true,
        headers: {
            "X-API-KEY": "YOUR_API_KEY",
            "Authorization": "Bearer <YOUR_TOKEN>"
        },
        payload: { "name": "New Name" },
        response: { "status": true, "message": "Profile updated successfully" }
      }
    ]
  },
  {
    name: "Admin Management",
    endpoints: [
      {
        method: "GET",
        path: "/admin/channels",
        title: "List All Channels (Admin)",
        admin: true,
        protected: true,
        headers: {
            "X-API-KEY": "YOUR_API_KEY",
            "Authorization": "Bearer <ADMIN_TOKEN>"
        },
        response: { 
            "status": true, 
            "data": { 
                "data": [{ "name": "Channel Name", "uuid": "uuid" }] 
            } 
        }
      },
      {
        method: "POST",
        path: "/admin/channels",
        title: "Create Channel",
        admin: true,
        protected: true,
        headers: {
            "X-API-KEY": "YOUR_API_KEY",
            "Authorization": "Bearer <ADMIN_TOKEN>"
        },
        payload: { "name": "New Channel", "hls_url": "https://..." },
        response: { 
            "status": true, 
            "data": { "uuid": "new-uuid", "name": "New Channel" } 
        }
      },
      {
        method: "GET",
        path: "/admin/customers",
        title: "List Customers",
        admin: true,
        protected: true,
        response: { 
            "status": true, 
            "data": { 
                "data": [{ "name": "Customer Name", "phone": "1234567890" }] 
            } 
        }
      },
      {
        method: "GET",
        path: "/admin/transactions",
        title: "Unified Transaction Report",
        description: "Get a unified list of gateway payments and wallet transactions.",
        admin: true,
        protected: true,
        queryParams: {
            "search": "phone or email",
            "gateway": "razorpay",
            "status": "success",
            "page": 1
        },
        response: { 
            "status": true, 
            "data": { 
                "data": [{ 
                    "type": "gateway",
                    "amount": 499.00,
                    "customer": { "name": "John", "phone": "..." },
                    "status": "success"
                }] 
            } 
        }
      }
    ]
  },
  {
    name: "Reseller Tools",
    endpoints: [
      {
        method: "GET",
        path: "/reseller/stats",
        title: "Dashboard Statistics",
        protected: true,
        response: {
          "status": true,
          "data": {
            "total_customers": 150,
            "active_subscriptions": 120,
            "wallet_balance": 5000.00
          }
        }
      },
      {
        method: "GET",
        path: "/reseller/wallet/balance",
        title: "Get Wallet Balance",
        protected: true,
        response: { "status": true, "data": { "balance": "1500.00", "currency": "INR" } }
      },
      {
        method: "POST",
        path: "/reseller/wallet/add-funds",
        title: "Initiate Wallet Topup",
        protected: true,
        payload: { "amount": 1000 },
        response: { 
            "status": true, 
            "data": { "gateway_order_id": "order_...", "amount": 1000 } 
        }
      }
    ]
  },
  {
    name: "Webhooks",
    endpoints: [
      {
        method: "POST",
        path: "/webhooks/razorpay",
        title: "Razorpay Webhook",
        description: "Real-time payment and order notifications.",
        headers: { "X-Razorpay-Signature": "..." },
        response: { "status": true, "message": "Webhook processed" }
      },
      {
        method: "POST",
        path: "/webhooks/resend",
        title: "Resend Webhook",
        description: "Email delivery status notifications.",
        response: { "status": true, "message": "Updated status to delivered" }
      }
    ]
  },
  {
    name: "API Key Management",
    endpoints: [
      {
        method: "GET",
        path: "/admin/api-keys",
        title: "List API Keys",
        admin: true,
        protected: true,
        headers: {
            "X-API-KEY": "YOUR_API_KEY",
            "Authorization": "Bearer <ADMIN_TOKEN>"
        },
        response: { 
            "status": true, 
            "data": [{ "title": "My Key", "key_string": "nk_...", "status": "active" }] 
        }
      },
      {
        method: "POST",
        path: "/admin/api-keys",
        title: "Create API Key",
        admin: true,
        protected: true,
        headers: {
            "X-API-KEY": "YOUR_API_KEY",
            "Authorization": "Bearer <ADMIN_TOKEN>"
        },
        payload: { "title": "New App Key", "description": "For Mobile App", "status": "active", "expires_at": "2026-12-31" },
        response: { "status": true, "data": { "uuid": "...", "key_string": "nk_..." } }
      },
      {
        method: "PUT",
        path: "/admin/api-keys/{uuid}",
        title: "Update API Key",
        admin: true,
        protected: true,
        payload: { "status": "inactive" },
        response: { 
            "status": true, 
            "data": { "uuid": "uuid", "status": "inactive" } 
        }
      },
      {
        method: "DELETE",
        path: "/admin/api-keys/{uuid}",
        title: "Delete API Key",
        admin: true,
        protected: true,
        response: { "status": true, "data": { "message": "API Key deleted" } }
      }
    ]
  },
  {
    name: "System Settings",
    endpoints: [
        {
            method: "GET",
            path: "/settings/public",
            title: "Get Public Settings",
            description: "Get global settings like logos and trending config.",
            headers: {
                "X-API-KEY": "YOUR_API_KEY"
            },
            response: {
                "status": true,
                "data": {
                    "logo_url": "http://...",
                    "app_logo_png_url": "http://..."
                }
            }
        }
    ]
  }
];

export default function ApiDocsPage() {
  const [openCategory, setOpenCategory] = useState<string | null>("Authentication");
  const [openEndpoint, setOpenEndpoint] = useState<string | null>(null);

  const toggleCategory = (name: string) => {
    setOpenCategory(openCategory === name ? null : name);
  };

  const toggleEndpoint = (id: string) => {
    setOpenEndpoint(openEndpoint === id ? null : id);
  };

  const copyToClipboard = (text: any) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    toast.success('Copied to clipboard');
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'POST': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'PUT': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'DELETE': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Globe className="w-8 h-8 text-primary" /> API Documentation
        </h1>
        <p className="text-text-secondary mt-2 max-w-2xl">
          Comprehensive guide to all available API endpoints, including required payloads and expected responses.
          <br/>
          <span className="text-primary text-sm font-medium mt-1 inline-block">
            Base URL: {process.env.NEXT_PUBLIC_API_URL || '/api'}
          </span>
        </p>
      </div>

      <div className="space-y-6">
        {apiData.map((category) => (
          <div key={category.name} className="bg-background-card border border-gray-800 rounded-xl overflow-hidden">
            <button 
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-left"
            >
              <h2 className="text-xl font-bold text-white">{category.name}</h2>
              {openCategory === category.name ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
            </button>

            {openCategory === category.name && (
              <div className="border-t border-gray-800 divide-y divide-gray-800">
                {category.endpoints.map((endpoint, idx) => {
                  const endpointId = `${category.name}-${idx}`;
                  const isOpen = openEndpoint === endpointId;

                  return (
                    <div key={idx} className="bg-black/20">
                      <button 
                        onClick={() => toggleEndpoint(endpointId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <span className={`px-2 py-1 rounded text-xs font-mono font-bold border ${getMethodColor(endpoint.method)} w-16 text-center`}>
                            {endpoint.method}
                          </span>
                          <span className="font-mono text-sm text-gray-300 truncate">{endpoint.path}</span>
                          <div className="flex gap-2">
                            {endpoint.protected && <span title="Requires API Key + Token"><Shield className="w-4 h-4 text-green-500" /></span>}
                            {endpoint.admin && <span title="Admin Only"><Lock className="w-4 h-4 text-red-500" /></span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 hidden md:inline-block">{endpoint.title}</span>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-4 pl-6 bg-black/40 border-t border-gray-800 space-y-4">
                          <p className="text-sm text-gray-400">{endpoint.description || endpoint.title}</p>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {endpoint.headers && (
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Required Headers</h4>
                                  <button onClick={() => copyToClipboard(endpoint.headers!)} className="text-gray-500 hover:text-white">
                                    <Copy size={12} />
                                  </button>
                                </div>
                                <pre className="bg-[#0d1117] rounded-lg p-3 text-xs text-orange-300 font-mono overflow-auto max-h-60 border border-gray-800 custom-scrollbar">
                                  {JSON.stringify(endpoint.headers, null, 2)}
                                </pre>
                              </div>
                            )}

                            {endpoint.queryParams && (
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Query Parameters</h4>
                                  <button onClick={() => copyToClipboard(endpoint.queryParams!)} className="text-gray-500 hover:text-white">
                                    <Copy size={12} />
                                  </button>
                                </div>
                                <pre className="bg-[#0d1117] rounded-lg p-3 text-xs text-blue-300 font-mono overflow-auto max-h-60 border border-gray-800 custom-scrollbar">
                                  {JSON.stringify(endpoint.queryParams, null, 2)}
                                </pre>
                              </div>
                            )}

                            {endpoint.payload && (
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Request Body</h4>
                                  <button onClick={() => copyToClipboard(endpoint.payload)} className="text-gray-500 hover:text-white">
                                    <Copy size={12} />
                                  </button>
                                </div>
                                <pre className="bg-[#0d1117] rounded-lg p-3 text-xs text-gray-300 font-mono overflow-auto max-h-60 border border-gray-800 custom-scrollbar">
                                  {JSON.stringify(endpoint.payload, null, 2)}
                                </pre>
                              </div>
                            )}

                            <div className={(endpoint.payload || endpoint.queryParams || endpoint.headers) ? '' : 'col-span-2'}>
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Response Example</h4>
                                <button onClick={() => copyToClipboard(endpoint.response)} className="text-gray-500 hover:text-white">
                                  <Copy size={12} />
                                </button>
                              </div>
                              <pre className="bg-[#0d1117] rounded-lg p-3 text-xs text-green-400/80 font-mono overflow-auto max-h-60 border border-gray-800 custom-scrollbar">
                                {JSON.stringify(endpoint.response, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
