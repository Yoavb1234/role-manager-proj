
import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [searchParams] = useSearchParams();

  // Check Supabase connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count');
        if (error) {
          console.error("Supabase connection test failed:", error);
          setConnectionError(true);
        } else {
          console.log("Supabase connection successful:", data);
        }
        setConnectionChecked(true);
      } catch (e) {
        console.error("Connection check failed:", e);
        setConnectionError(true);
        setConnectionChecked(true);
      }
    };
    
    checkConnection();
  }, []);

  useEffect(() => {
    // Check if user came from email confirmation
    const handleEmailConfirmation = async () => {
      // Get the hash from the URL
      const hash = window.location.hash;
      
      if (hash && hash.includes('access_token')) {
        try {
          setMessage("Confirming your email...");
          
          // Extract the access token from the URL
          const accessToken = hash.substring(1).split('&').find(param => param.startsWith('access_token'))?.split('=')[1];
          
          if (accessToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: '',
            });
            
            if (error) throw error;
            
            setMessage("Email confirmed successfully! You can now log in.");
          }
        } catch (error) {
          console.error("Error confirming email:", error);
          setError("Failed to confirm email. Please try again or contact support.");
        }
      }
      
      // Check for email confirmation message from signup page
      const confirmationStatus = searchParams.get("emailConfirmation");
      if (confirmationStatus === "pending") {
        setMessage("We've sent a confirmation email. Please check your inbox and confirm your email address before logging in.");
      }
    };
    
    handleEmailConfirmation();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to log in");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-border/40 shadow-black/5 backdrop-blur-sm bg-card/80">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to connect to the database. The application may not function correctly.
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-background/50"
            />
          </div>
          
          {/* Database Status Info */}
          <Alert className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Database Status:</span> {!connectionChecked ? 'Checking...' : connectionError ? 'Connection error' : 'Connected'}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button 
            type="submit" 
            className="w-full mb-4" 
            disabled={isSubmitting || connectionError}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary hover:underline transition-all"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

export default Login;
