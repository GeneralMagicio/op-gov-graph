import React from "react";

const GraphHeader = () => {
  return (
    <header className="p-4 border-b">
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-bold">OP GovGraph</h1>
        <div className="border-l pl-8 flex-grow">
          <input
            type="text"
            placeholder="Search by address, ENS or Attestation"
            className="w-96 p-2 rounded"
          />
        </div>
      </div>
    </header>
  );
};

export default GraphHeader;
