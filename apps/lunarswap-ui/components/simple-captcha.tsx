'use client';

import { CheckCircle, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

interface SimpleCaptchaProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (token: string) => void;
}

export function SimpleCaptcha({
  isOpen,
  onClose,
  onVerify,
}: SimpleCaptchaProps) {
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = () => {
    setIsVerified(true);
    // Generate a simple token based on timestamp and user action
    const token = `human-verified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    onVerify(token);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-auto border-0 shadow-lg bg-white dark:bg-gray-800">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-semibold">Human Verification</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please verify that you are human to request tokens
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-medium">Simple Verification</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the button below to confirm you are human
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isVerified}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
          >
            {isVerified ? 'Verified ✓' : 'I am Human'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
