import { useState, useRef, useEffect } from "react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Loader2, Mail, Shield, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface OTPVerificationProps {
  email: string;
  onVerify: (otp: string) => Promise<boolean>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isLogin?: boolean;
}

const OTPVerification = ({ email, onVerify, onResend, onBack, isLogin = false }: OTPVerificationProps) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
    try {
      const success = await onVerify(otpString);
      if (!success) {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setIsResending(true);
    try {
      await onResend();
      setCountdown(60);
      setCanResend(false);
      toast.success("New OTP sent to your email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">Verify Your {isLogin ? "Login" : "Email"}</CardTitle>
        <CardDescription className="flex items-center justify-center gap-2">
          <Mail className="h-4 w-4" />
          OTP sent to {email}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* OTP Input */}
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-11 h-12 text-center text-lg font-semibold"
            />
          ))}
        </div>

        {/* Verify Button */}
        <Button 
          onClick={handleVerify} 
          className="w-full" 
          disabled={isVerifying || otp.some(d => !d)}
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Verify OTP
            </>
          )}
        </Button>

        {/* Resend */}
        <div className="text-center">
          {canResend ? (
            <Button 
              variant="ghost" 
              onClick={handleResend}
              disabled={isResending}
              className="text-sm"
            >
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Resend OTP
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resend OTP in <span className="font-semibold text-primary">{countdown}s</span>
            </p>
          )}
        </div>

        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={onBack}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </CardContent>
    </Card>
  );
};

export default OTPVerification;
