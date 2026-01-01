import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tasks } from "@/data/bookingData";
import TaskCard from "@/components/booking/TaskCard";
import BookingRequestForm from "@/components/booking/BookingRequestForm";
import { ArrowLeft, Plus, TrendingUp, Users, DollarSign, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Tasks = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...new Set(tasks.map(t => t.category))];

  const filteredTasks = selectedCategory === "all" 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  const handleParticipate = (task: typeof tasks[0]) => {
    toast({
      title: "Participation Confirmed!",
      description: `You've signed up for "${task.title}". Complete it before ${new Date(task.deadline).toLocaleDateString()} to earn $${task.reward}.`,
    });
  };

  const totalRewards = tasks.reduce((sum, t) => sum + t.reward, 0);
  const totalParticipants = tasks.reduce((sum, t) => sum + t.participants, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-primary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Link to="/deals" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Task Center</h1>
          <p className="text-white/90">Complete tasks and earn money, or post your own tasks</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalRewards}</p>
                  <p className="text-xs text-muted-foreground">Total Rewards</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                  <p className="text-xs text-muted-foreground">Active Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalParticipants}</p>
                  <p className="text-xs text-muted-foreground">Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">24h</p>
                  <p className="text-xs text-muted-foreground">Avg. Payout</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="available">Available Tasks</TabsTrigger>
              <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
              <TabsTrigger value="post-task">Post a Task</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="available">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((cat) => (
                <Badge 
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>

            {/* Task Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onParticipate={handleParticipate} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-tasks">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't participated in any tasks yet.</p>
              <Button variant="outline">Browse Available Tasks</Button>
            </Card>
          </TabsContent>

          <TabsContent value="post-task">
            <Card className="p-6">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-2 text-center">Post Your Own Task</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Need something done? Post a task and let our community help you complete it.
                </p>
                <div className="flex justify-center">
                  <BookingRequestForm 
                    serviceTypes={[
                      "Social Media Marketing",
                      "Content Creation",
                      "Translation",
                      "Data Entry",
                      "Survey/Research",
                      "App Testing",
                      "Video Creation",
                      "Writing/Editing",
                      "Other"
                    ]}
                    title="Post a New Task"
                    description="Describe your task requirements and set a budget. After payment, your task will be posted for participants."
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Tasks;
