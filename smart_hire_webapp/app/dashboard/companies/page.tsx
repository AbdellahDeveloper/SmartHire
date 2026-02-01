"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addCompanyAccount, deleteCompany, getCompanies } from "./actions";

export default function CompaniesManagementPage() {
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const [companyData, setCompanyData] = useState({
        companyName: "",
        email: ""
    });

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const data = await getCompanies();
            setCompanies(data);
        } catch {
            toast.error("Failed to load companies");
        }
    };

    const handleCreateCompany = async () => {
        setLoading(true);
        const result = await addCompanyAccount(companyData);
        if (result.success) {
            toast.success(`Company account created. An email has been sent to ${companyData.email} to define the account password.`);
            setCompanyData({ companyName: "", email: "" });
            loadCompanies();
        } else {
            toast.error(result.error || "Failed to create company");
        }
        setLoading(false);
    };

    const handleDeleteCompany = async (id: string) => {
        const result = await deleteCompany(id);
        if (result.success) {
            toast.success("Company and all associated data deleted");
            loadCompanies();
        } else {
            toast.error(result.error || "Failed to delete company");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Company Management</h2>
                <p className="text-muted-foreground">Manage and onboard companies to the platform.</p>
            </div>

            <div className="grid gap-6">
                <Card className="bg-card/50 border-border backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Add New Company</CardTitle>
                        <CardDescription>Onboard a new company to the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input
                                    className="bg-muted border-border"
                                    placeholder="Acme Corp"
                                    value={companyData.companyName}
                                    onChange={(e) => setCompanyData(prev => ({ ...prev, companyName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Admin Email</Label>
                                <Input
                                    className="bg-muted border-border"
                                    placeholder="admin@acme.com"
                                    value={companyData.email}
                                    onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleCreateCompany}
                            disabled={loading || !companyData.companyName || !companyData.email}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
                        >
                            {loading ? "Creating..." : "Create Company Profile"}
                        </Button>
                    </CardContent>
                </Card>

                <div className="grid gap-4 mt-6">
                    <h3 className="text-lg font-medium text-foreground">Registered Companies ({companies.length})</h3>
                    {companies.length === 0 ? (
                        <Card className="bg-card/30 border-border border-dashed">
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No companies registered yet.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {companies.map((company) => (
                                <Card key={company.id} className="bg-card/30 border-border hover:border-primary/50 transition-colors group">
                                    <CardContent className="p-4 flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1 min-w-0 flex-1 mr-2">
                                                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate" title={company.name}>{company.name}</h4>
                                                <p className="text-sm text-muted-foreground truncate" title={company.email}>{company.email}</p>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full shadow-sm hover:shadow-md transition-all shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                                            <AlertTriangle className="w-5 h-5" />
                                                            Are you absolutely sure?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription className="space-y-4">
                                                            <p>
                                                                This action cannot be undone. This will permanently delete the
                                                                company profile for <span className="font-bold text-foreground">"{company.name}"</span>.
                                                            </p>
                                                            <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-xs text-destructive">
                                                                <p className="font-semibold mb-1">Warning: Cascading Deletion</p>
                                                                <ul className="list-disc list-inside space-y-1">
                                                                    <li>All job postings will be removed</li>
                                                                    <li>All matching history and reports will be deleted</li>
                                                                    <li>All scheduled meetings will be canceled</li>
                                                                    <li>All associated user accounts will be revoked</li>
                                                                </ul>
                                                            </div>
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteCompany(company.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Delete Company
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                            <div className="text-[10px] text-muted-foreground/60 font-mono">
                                                ID: {company.id.substring(0, 8)}...
                                            </div>
                                            <div className="text-[10px] text-muted-foreground/60 italic">
                                                {new Date(company.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
