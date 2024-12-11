"use client";

import React from "react";
import { LeadsTable } from "../../../../components/activity/leads-table";

const demoLeads = [
  {
    id: "1",
    title: "Scanner Hire Services",
    status: "Contacted",
    activity: {
      text: "Work with Scanner Hire Services",
      date: "16/09/2022",
      time: "08:15 am",
    },
    assignedTo: "Samuel Nalwebc",
    createdAt: "15/09/2022",
  },
  {
    id: "2",
    title: "Pride Microfinance EDRMS",
    status: "Contacted",
    activity: {
      text: "Field visit to Pride Microfinance for a business meeting",
      date: "17/01/2023",
      time: "09:00 pm",
    },
    assignedTo: "Fredrick Rwakiguma",
    createdAt: "05/10/2022",
  },
  {
    id: "3",
    title: "UIA Digitization of Procurement records",
    status: "Contacted",
    activity: {
      text: "No activities",
      date: "",
      time: "",
    },
    assignedTo: "Untitled",
    createdAt: "05/10/2022",
  },
];

const ActivitiesPage: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="mb-4">Lists</h2>
      <LeadsTable
        leads={demoLeads}
        onEdit={(lead) => console.log("Edit lead:", lead)}
        onDelete={(leadId) => console.log("Delete lead:", leadId)}
      />
    </div>
  );
};

export default ActivitiesPage;
