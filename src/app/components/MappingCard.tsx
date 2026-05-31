import React from "react";
import { ArrowRight, Info, AlertCircle, Box, Braces } from "lucide-react";
import { cn } from "../utils/cn";
import { Mapping } from "../utils/data";

interface Props {
  mapping: Mapping;
}

const SystemBox = ({
  system,
  objectName,
  fieldName,
  fieldType,
  parentObject,
}: {
  system: "Salesforce" | "Metronome";
  objectName: string;
  fieldName: string;
  fieldType?: string;
  parentObject?: string;
}) => (
  <div
    className={cn(
      "flex-1 rounded-xl p-4 border",
      system === "Salesforce"
        ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-900 dark:text-blue-300"
        : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-300"
    )}
  >
    <div className="flex items-center gap-2 mb-3">
      <div
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm",
          system === "Salesforce"
            ? "bg-blue-600 dark:bg-blue-500 text-white"
            : "bg-emerald-600 dark:bg-emerald-500 text-white"
        )}
      >
        {system === "Salesforce" ? "SF" : "MT"}
      </div>
      <div>
        <h3 className="font-semibold text-sm uppercase tracking-wider opacity-80">
          {system}
        </h3>
      </div>
    </div>

    <div className="space-y-3">
      {parentObject && (
        <div className="flex items-start gap-2">
          <Box className="w-4 h-4 mt-0.5 opacity-60 shrink-0" />
          <div>
            <div className="text-xs uppercase font-medium opacity-60">
              Parent Object
            </div>
            <div className="font-medium">{parentObject}</div>
          </div>
        </div>
      )}
      <div className="flex items-start gap-2">
        <Box className="w-4 h-4 mt-0.5 opacity-60 shrink-0" />
        <div>
          <div className="text-xs uppercase font-medium opacity-60">Object</div>
          <div className="font-medium break-all">
            {objectName || <span className="text-gray-400 dark:text-gray-500 italic text-sm">Unmapped</span>}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Braces className="w-4 h-4 mt-0.5 opacity-60 shrink-0" />
        <div>
          <div className="text-xs uppercase font-medium opacity-60">Field</div>
          <div className="font-medium break-all text-sm font-mono mt-0.5 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded border border-white/20 dark:border-white/10 inline-block">
            {fieldName || <span className="text-gray-400 dark:text-gray-500 italic text-xs px-1">Unmapped</span>}
          </div>
        </div>
      </div>
      {fieldType && (
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center">
            <span className="text-[10px] font-bold opacity-60 border border-current rounded-sm px-0.5 leading-none">
              T
            </span>
          </div>
          <div>
            <div className="text-xs uppercase font-medium opacity-60">Type</div>
            <div className="font-medium text-sm">{fieldType}</div>
          </div>
        </div>
      )}
    </div>
  </div>
);

const inferMissingSalesforceData = (
  mapping: Mapping,
  currentObject: string,
  currentField: string
) => {
  let objectName = currentObject?.trim() || "";
  let fieldName = currentField?.trim() || "";

  if (objectName && fieldName) return { objectName, fieldName };

  const metronomeObject = (
    mapping["Metronome Object"] ||
    mapping[" Metronome Object "] ||
    ""
  ).trim();
  const metronomeField = (
    mapping["Metronome Field"] ||
    mapping[" Metronome Field "] ||
    ""
  ).trim();

  const notes = (mapping.Notes || mapping[" Notes "] || "").toLowerCase();
  const transform = (
    mapping["Transformation / Logic"] ||
    mapping[" Transformation / Logic "] ||
    ""
  ).toLowerCase();
  const isCustomMetadata =
    notes.includes("custom metadata") || transform.includes("custom metadata");

  if (isCustomMetadata) {
    if (!objectName) objectName = "Metronome_Config__mdt";
    if (!fieldName) {
      if (metronomeField === "rate_card_id") fieldName = "Rate_Card_Id__c";
      if (metronomeField === "is_prorated") fieldName = "Is_Prorated__c";
      if (metronomeField === "collection_schedule") fieldName = "Collection_Schedule__c";
      if (metronomeField === "priority") {
        fieldName =
          metronomeObject === "recurring_credits"
            ? "Recurring_Credit_Priority__c"
            : "Credit_Priority__c";
      }
      if (metronomeField === "allocation") fieldName = "Allocation__c";
      if (metronomeField === "unit") fieldName = "Commit_Duration_Unit__c";
      if (metronomeField === "credit_type_id") fieldName = "Credit_Type_Id__c";
      if (metronomeField === "invoice_behavior") fieldName = "Invoice_Behavior__c";
    }
  } else {
    // Specific business logic mappings for remaining empty fields
    if (metronomeObject === "credits" && metronomeField === "applicable_product_ids") {
      if (!objectName) objectName = "Order Product";
      if (!fieldName) fieldName = "Product2Id";
    } else if (metronomeObject === "access_schedule" && metronomeField === "amount") {
      if (!objectName) objectName = "Order Product";
      if (!fieldName) fieldName = "TotalPrice";
    } else if (metronomeObject === "commit_duration" && metronomeField === "value") {
      if (!objectName) objectName = "Order Product";
      if (!fieldName) fieldName = "Service_Term__c";
    }
  }

  return { objectName, fieldName };
};

export const MappingCard: React.FC<Props> = ({ mapping }) => {
  const isSfdcToMetronome = (mapping.Direction || mapping[" Direction "] || mapping["Direction "] || mapping[" Direction"])?.trim().startsWith("Salesforce");

  const rawSfdcObject = mapping["Salesforce Object"] || mapping[" Salesforce Object "] || mapping["Salesforce Object "] || mapping[" Salesforce Object"];
  const rawSfdcField = mapping["Salesforce Field"] || mapping[" Salesforce Field "] || mapping["Salesforce Field "] || mapping[" Salesforce Field"];
  
  const { objectName: sfdcObjectName, fieldName: sfdcFieldName } = inferMissingSalesforceData(mapping, rawSfdcObject as string, rawSfdcField as string);

  const sfdcBox = (
    <SystemBox
      system="Salesforce"
      objectName={sfdcObjectName}
      fieldName={sfdcFieldName}
    />
  );

  const metronomeBox = (
    <SystemBox
      system="Metronome"
      objectName={mapping["Metronome Object"] || mapping[" Metronome Object "] || mapping["Metronome Object "] || mapping[" Metronome Object"]}
      fieldName={mapping["Metronome Field"] || mapping[" Metronome Field "] || mapping["Metronome Field "] || mapping[" Metronome Field"]}
      fieldType={mapping["Metronome Field Type"] || mapping[" Metronome Field Type "] || mapping["Metronome Field Type "] || mapping[" Metronome Field Type"]}
      parentObject={mapping["Metronome Parent Object (1)"] || mapping[" Metronome Parent Object (1) "] || mapping["Metronome Parent Object (1) "] || mapping[" Metronome Parent Object (1)"]}
    />
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold">
            {(mapping["Sync operation"] || mapping[" Sync operation "] || mapping["Sync operation "] || mapping[" Sync operation"])?.trim() || "Unknown Operation"}
          </span>
          <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
            {mapping.Direction || mapping[" Direction "] || mapping["Direction "] || mapping[" Direction"]}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {isSfdcToMetronome ? sfdcBox : metronomeBox}

          <div className="flex items-center justify-center py-2 md:py-0">
            <div className="bg-gray-100 dark:bg-slate-800 rounded-full p-2 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
              <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0" />
            </div>
          </div>

          {isSfdcToMetronome ? metronomeBox : sfdcBox}
        </div>

        {(mapping["Transformation / Logic"] || mapping[" Transformation / Logic "] || mapping["Transformation / Logic "] || mapping[" Transformation / Logic"] || mapping.Notes || mapping[" Notes "] || mapping["Notes "] || mapping[" Notes"]) && (
          <div className="mt-5 space-y-3 pt-5 border-t border-gray-100 dark:border-slate-800">
            {(mapping["Transformation / Logic"] || mapping[" Transformation / Logic "] || mapping["Transformation / Logic "] || mapping[" Transformation / Logic"]) && (
              <div className="flex gap-3 text-sm">
                <div className="mt-0.5 text-blue-500 dark:text-blue-400 shrink-0">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    Transformation / Logic
                  </h4>
                  <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                    {mapping["Transformation / Logic"] || mapping[" Transformation / Logic "] || mapping["Transformation / Logic "] || mapping[" Transformation / Logic"]}
                  </p>
                </div>
              </div>
            )}
            {(mapping.Notes || mapping[" Notes "] || mapping["Notes "] || mapping[" Notes"]) && (
              <div className="flex gap-3 text-sm">
                <div className="mt-0.5 text-amber-500 dark:text-amber-400 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Notes</h4>
                  <p className="text-gray-600 dark:text-slate-300 leading-relaxed">{mapping.Notes || mapping[" Notes "] || mapping["Notes "] || mapping[" Notes"]}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
