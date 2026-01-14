import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, CreditCard, Building2, 
  Smartphone, History, TrendingUp, ShieldCheck, Plus, Send,
  QrCode, Copy, CheckCircle2, AlertCircle, Clock, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "payment" | "received";
  amount: number;
  description: string;
  status: "completed" | "pending" | "failed";
  date: Date;
  reference: string;
}

const WalletPage = () => {
  const { user, profile } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRecipient, setPaymentRecipient] = useState("");
  const [depositMethod, setDepositMethod] = useState("card");
  const [withdrawMethod, setWithdrawMethod] = useState("bank");
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load wallet data
  useEffect(() => {
    const savedBalance = localStorage.getItem("wallet-balance");
    const savedTransactions = localStorage.getItem("wallet-transactions");
    
    if (savedBalance) setBalance(parseFloat(savedBalance));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
  }, []);

  // Save wallet data
  const saveWalletData = (newBalance: number, newTransactions: Transaction[]) => {
    localStorage.setItem("wallet-balance", newBalance.toString());
    localStorage.setItem("wallet-transactions", JSON.stringify(newTransactions));
    setBalance(newBalance);
    setTransactions(newTransactions);
  };

  const generateReference = () => {
    return `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: "deposit",
        amount,
        description: `Deposit via ${depositMethod === "card" ? "Card" : depositMethod === "bank" ? "Bank Transfer" : "Mobile Money"}`,
        status: "completed",
        date: new Date(),
        reference: generateReference(),
      };

      const newBalance = balance + amount;
      saveWalletData(newBalance, [newTransaction, ...transactions]);
      
      setIsProcessing(false);
      setShowDepositDialog(false);
      setDepositAmount("");
      toast.success(`Successfully deposited ${formatPrice(amount)}`);
    }, 2000);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: "withdrawal",
        amount,
        description: `Withdrawal to ${withdrawMethod === "bank" ? "Bank Account" : "Mobile Money"}`,
        status: "pending",
        date: new Date(),
        reference: generateReference(),
      };

      const newBalance = balance - amount;
      saveWalletData(newBalance, [newTransaction, ...transactions]);
      
      setIsProcessing(false);
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
      toast.success(`Withdrawal of ${formatPrice(amount)} is being processed`);
    }, 2000);
  };

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!paymentRecipient.trim()) {
      toast.error("Please enter recipient details");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: "payment",
        amount,
        description: `Payment to ${paymentRecipient}`,
        status: "completed",
        date: new Date(),
        reference: generateReference(),
      };

      const newBalance = balance - amount;
      saveWalletData(newBalance, [newTransaction, ...transactions]);
      
      setIsProcessing(false);
      setShowPaymentDialog(false);
      setPaymentAmount("");
      setPaymentRecipient("");
      toast.success(`Successfully sent ${formatPrice(amount)} to ${paymentRecipient}`);
    }, 2000);
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit": return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case "withdrawal": return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case "payment": return <Send className="h-4 w-4 text-orange-500" />;
      case "received": return <ArrowDownLeft className="h-4 w-4 text-success" />;
    }
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "completed": return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case "pending": return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
      case "failed": return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/account">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">My Wallet</h1>
              <p className="text-sm text-muted-foreground">Manage your funds</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Available Balance</p>
                <p className="text-4xl font-bold mt-1">{formatPrice(balance)}</p>
                <div className="flex items-center gap-2 mt-3">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm opacity-80">Secured with encryption</span>
                </div>
              </div>
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <Plus className="h-6 w-6 text-success" />
                  </div>
                  <p className="font-medium">Deposit</p>
                  <p className="text-xs text-muted-foreground">Add money</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deposit Funds</DialogTitle>
                <DialogDescription>Add money to your wallet</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Amount ({currency.code})</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={depositMethod} onValueChange={setDepositMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Credit/Debit Card
                        </div>
                      </SelectItem>
                      <SelectItem value="bank">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Bank Transfer
                        </div>
                      </SelectItem>
                      <SelectItem value="mobile">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Mobile Money
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {depositAmount && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">You will deposit</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(parseFloat(depositAmount) || 0)}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDepositDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDeposit} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Deposit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                    <ArrowUpRight className="h-6 w-6 text-destructive" />
                  </div>
                  <p className="font-medium">Withdraw</p>
                  <p className="text-xs text-muted-foreground">Cash out</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
                <DialogDescription>Transfer money to your bank or mobile money</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-xl font-bold">{formatPrice(balance)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Amount ({currency.code})</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Withdraw To</Label>
                  <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Bank Account
                        </div>
                      </SelectItem>
                      <SelectItem value="mobile">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Mobile Money
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleWithdraw} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Withdraw"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                    <Send className="h-6 w-6 text-orange-500" />
                  </div>
                  <p className="font-medium">Pay</p>
                  <p className="text-xs text-muted-foreground">Send money</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Payment</DialogTitle>
                <DialogDescription>Pay someone or make a purchase</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Recipient (Email or Phone)</Label>
                  <Input
                    placeholder="Enter email or phone"
                    value={paymentRecipient}
                    onChange={(e) => setPaymentRecipient(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount ({currency.code})</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                {paymentAmount && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total to send</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(parseFloat(paymentAmount) || 0)}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePayment} disabled={isProcessing}>
                  {isProcessing ? "Sending..." : "Send Payment"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>Your recent wallet activities</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground">Your transactions will appear here</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()} • {transaction.reference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === "deposit" || transaction.type === "received"
                            ? "text-success"
                            : "text-destructive"
                        }`}>
                          {transaction.type === "deposit" || transaction.type === "received" ? "+" : "-"}
                          {formatPrice(transaction.amount)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;
