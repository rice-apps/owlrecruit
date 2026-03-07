"use client"
import {useState} from "react";
import {createClient} from "@/lib/supabase/client"
import OrganizationsSection, {OrgMembership} from "./organizations-section";
import { useRouter } from "next/navigation";



interface ProfileFormProps {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
    orgMemberships: OrgMembership[];

}


export default function ProfileForm({firstName, lastName, email, userId, orgMemberships }: ProfileFormProps){
    const router = useRouter();


    const [first, setFirst] = useState(firstName);
    const [last, setLast] = useState(lastName);
    const [emailVal, setEmailVal] = useState(email);
    const [initialFirst, setInitialFirst] = useState(firstName);
    const [initialLast, setInitialLast] = useState(lastName);
    const [initialEmail, setInitialEmail] = useState(email);

    const handleReset = () => {
        setFirst(initialFirst);
        setLast(initialLast);
        setEmailVal(initialEmail);
    };

    const handleSave = async () => {
    const supabase = createClient();

    const { error: nameError } = await supabase
        .from("users")
        .update({ name: `${first} ${last}`.trim() })
        .eq("id", userId);

    const { error: emailError } = await supabase.auth.updateUser({ email: emailVal });

    if (!nameError && !emailError) {
        // Update the baseline so reset goes back to the newly saved values
        setInitialFirst(first);
        setInitialLast(last);
        setInitialEmail(emailVal);
        router.refresh(); // 👈 this re-fetches all server components

    }
    };

    return (
        <div className="flex flex-col w-full max-w-5xl">
            {/* Name Section */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Name
                </label>
                <div className="flex gap-4">
                {/* First Name Input */}
                    <input
                        type="text"
                        value={first}
                        onChange={(e) => setFirst(e.target.value)}
                        placeholder="John"
                        className="flex-1 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-owl-purple focus:border-transparent"
                    />
                {/* Last Name Input */}
                    <input
                        type="text"
                        value={last}
                        onChange = {(e) => setLast(e.target.value)}
                        placeholder="Doe"
                        className="flex-1 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-owl-purple focus:border-transparent"
                    />
                </div>
            </div>

            {/* Email Section */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                Rice Email
                </label>
                <input
                type="email"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                placeholder="john.doe@example.com"
                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-owl-purple focus:border-transparent"
                />
            </div>


            <OrganizationsSection memberships={orgMemberships} userId={userId} />
            <div className="flex items-center justify-end gap-3 mt-4">
                <button onClick={handleReset} className="px-4 py-2">Reset</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-md text-white" 
                        style={{ backgroundColor: '#9692e3' }}>Save</button>
            </div>    
        </div>
    );
}
