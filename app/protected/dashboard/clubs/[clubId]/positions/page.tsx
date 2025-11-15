"use client"
import PositionCard from "./components/positionCard";

export default function OpenPositions() {
return (
    <>
    <div className="w-full px-36">
      <div className="p-6">
        {/* Open Positions Header */}
        <div>
          <h1 className="text-left font-bold text-3xl mb-4">Open Positions</h1>
        </div>

        {/* Position Cards */}
        <div className="mt-6 flex gap-10">
          <PositionCard title="Product Lead" dueDate="12/25/2025" role="positionName"/>
          <PositionCard title="Tech Lead" dueDate="04/20/2026" role="positionName"/>
          <PositionCard title="CEO" dueDate="06/09/2025" role="positionName"/>
        </div>
      </div>
    </div>
    </>
);
}
