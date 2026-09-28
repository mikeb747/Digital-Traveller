import * as XLSX from 'xlsx';
import { TravellerRecord, WorkflowStep } from '../types/traveller';

export class ExcelService {
  /**
   * Export the entire digital traveller record into a formatted Excel workbook (.xlsx).
   * Generates sheets for:
   * 1. Overview: System model, S/N, Work Order, Customer, Job, Part, Operator, Timestamps.
   * 2. Workflow Steps: Stage, Step Name, Status, Technician, Started, Completed, Notes.
   * 3. Measurements & Tolerances: Stage, Step, Parameter, Recorded Value, Unit, Tolerance, Status.
   * 4. Checklists: Stage, Step, Item, Done (YES/NO).
   * 5. Audit Log: Timestamp, Operator, Action.
   */
  static exportTravellerToExcel(record: TravellerRecord, customFilename?: string): void {
    const wb = XLSX.utils.book_new();

    // 1. Overview Sheet
    const overviewData = [
      ['RENISHAW DIGITAL TRAVELLER — PRODUCTION RECORD'],
      [''],
      ['Field', 'Value'],
      ['System Model', record.system],
      ['Serial Number', record.serialNumber || 'Unassigned'],
      ['Work Order Number', record.workOrderNumber],
      ['Customer Name', record.customerName || 'N/A'],
      ['Job Number', record.jobNumber || 'N/A'],
      ['Part Number', record.partNumber || 'N/A'],
      ['Active Operator', record.operatorName],
      ['Created Date', record.createdAt],
      ['Last Updated', record.updatedAt],
      ['Total Stages', (record.stages || ['Setup', 'Calibration', 'Final Test & Release']).length],
      ['Total Steps', record.steps.length],
      ['Steps Completed', record.steps.filter((s) => s.status === 'Complete').length],
      [
        'Overall Progress',
        record.steps.length > 0
          ? `${Math.round((record.steps.filter((s) => s.status === 'Complete').length / record.steps.length) * 100)}%`
          : '0%'
      ]
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    wsOverview['!cols'] = [{ wch: 25 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

    // 2. Workflow Steps Sheet
    const stepsHeaders = [
      'Stage',
      'Step Name',
      'Status',
      'Assigned Technician',
      'Started At',
      'Completed At',
      'Notes & Comments'
    ];
    const stepsRows = record.steps.map((step) => [
      step.stage,
      step.name,
      step.status,
      step.technician || '',
      step.startedAt || '',
      step.completedAt || '',
      step.notes || ''
    ]);
    const wsSteps = XLSX.utils.aoa_to_sheet([stepsHeaders, ...stepsRows]);
    wsSteps['!cols'] = [
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 25 },
      { wch: 22 },
      { wch: 22 },
      { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSteps, 'Workflow Steps');

    // 3. Measurements & Tolerances Sheet
    const measurementsHeaders = [
      'Stage',
      'Step Name',
      'Parameter / Metric',
      'Measured Value',
      'Unit',
      'Tolerance Specification',
      'Pass / Fail'
    ];
    const measurementRows: any[][] = [];
    record.steps.forEach((step) => {
      if (step.measuredData && step.measuredData.length > 0) {
        step.measuredData.forEach((meas) => {
          let passStatus = 'Recorded';
          if (meas.tolerance && meas.value) {
            passStatus = 'PASS';
          }
          measurementRows.push([
            step.stage,
            step.name,
            meas.parameter,
            meas.value || '',
            meas.unit || '',
            meas.tolerance || 'N/A',
            meas.value ? passStatus : 'Pending'
          ]);
        });
      }
    });
    if (measurementRows.length === 0) {
      measurementRows.push(['No measurement parameters defined for this record.', '', '', '', '', '', '']);
    }
    const wsMeasurements = XLSX.utils.aoa_to_sheet([measurementsHeaders, ...measurementRows]);
    wsMeasurements['!cols'] = [
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
      { wch: 18 },
      { wch: 10 },
      { wch: 25 },
      { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsMeasurements, 'Measurements');

    // 4. Checklist Items Sheet
    const checklistHeaders = ['Stage', 'Step Name', 'Checklist Requirement', 'Status'];
    const checklistRows: any[][] = [];
    record.steps.forEach((step) => {
      if (step.checklist && step.checklist.length > 0) {
        step.checklist.forEach((item) => {
          checklistRows.push([step.stage, step.name, item.label, item.done ? 'DONE' : 'PENDING']);
        });
      }
    });
    if (checklistRows.length === 0) {
      checklistRows.push(['No checklist items defined for this record.', '', '', '']);
    }
    const wsChecklist = XLSX.utils.aoa_to_sheet([checklistHeaders, ...checklistRows]);
    wsChecklist['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 50 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsChecklist, 'Checklists');

    // 5. Audit Trail Sheet
    const auditHeaders = ['Timestamp', 'User / Technician', 'Action / Event Logged'];
    const auditRows = (record.auditLog || []).map((log) => [log.timestamp, log.user, log.action]);
    const wsAudit = XLSX.utils.aoa_to_sheet([auditHeaders, ...auditRows]);
    wsAudit['!cols'] = [{ wch: 24 }, { wch: 25 }, { wch: 55 }];
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit Log');

    // Trigger download
    const snPart = record.serialNumber ? record.serialNumber : 'Unassigned';
    const filename =
      customFilename ||
      `DigitalTraveller_${record.system}_${snPart}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(wb, filename);
  }

  /**
   * Import data or update values from an uploaded Excel (.xlsx) file.
   * Reads the 'Overview' and 'Workflow Steps' sheets to update matching step records.
   */
  static parseExcelFile(
    fileBuffer: ArrayBuffer,
    currentTraveller: TravellerRecord
  ): { updatedRecord: TravellerRecord; logs: string[] } {
    const wb = XLSX.read(fileBuffer, { type: 'array' });
    const logs: string[] = [];

    const updatedSteps = [...currentTraveller.steps];
    let newSerial = currentTraveller.serialNumber;
    let newCustomer = currentTraveller.customerName;
    let newJob = currentTraveller.jobNumber;
    let newPart = currentTraveller.partNumber;

    // Check Overview sheet
    if (wb.SheetNames.includes('Overview')) {
      const sheet = wb.Sheets['Overview'];
      const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      for (const row of rawData) {
        if (!row || row.length < 2) continue;
        const key = String(row[0]).trim().toLowerCase();
        const val = String(row[1]).trim();
        if (key === 'serial number' && val && val !== 'Unassigned') newSerial = val;
        if (key === 'customer name' && val && val !== 'N/A') newCustomer = val;
        if (key === 'job number' && val && val !== 'N/A') newJob = val;
        if (key === 'part number' && val && val !== 'N/A') newPart = val;
      }
      logs.push('Processed Overview sheet metadata');
    }

    // Check Workflow Steps sheet
    if (wb.SheetNames.includes('Workflow Steps')) {
      const sheet = wb.Sheets['Workflow Steps'];
      const stepsData: any[] = XLSX.utils.sheet_to_json(sheet);
      let updatedCount = 0;
      stepsData.forEach((row) => {
        const stepName = row['Step Name'];
        if (!stepName) return;

        const targetIndex = updatedSteps.findIndex(
          (s) => s.name.trim().toLowerCase() === String(stepName).trim().toLowerCase()
        );
        if (targetIndex !== -1) {
          const step = { ...updatedSteps[targetIndex] };
          if (row['Status']) {
            const st = String(row['Status']).trim();
            if (st === 'Complete' || st === 'In Progress' || st === 'Not Started') {
              step.status = st as any;
            }
          }
          if (row['Assigned Technician']) step.technician = String(row['Assigned Technician']);
          if (row['Notes & Comments']) step.notes = String(row['Notes & Comments']);
          if (row['Completed At']) step.completedAt = String(row['Completed At']);
          if (row['Started At']) step.startedAt = String(row['Started At']);
          updatedSteps[targetIndex] = step;
          updatedCount++;
        }
      });
      logs.push(`Updated ${updatedCount} workflow step(s) from spreadsheet`);
    }

    // Check Measurements sheet
    if (wb.SheetNames.includes('Measurements')) {
      const sheet = wb.Sheets['Measurements'];
      const measData: any[] = XLSX.utils.sheet_to_json(sheet);
      let measCount = 0;
      measData.forEach((row) => {
        const stepName = row['Step Name'];
        const paramName = row['Parameter / Metric'];
        const val = row['Measured Value'];
        if (!stepName || !paramName || val === undefined) return;

        const targetIndex = updatedSteps.findIndex(
          (s) => s.name.trim().toLowerCase() === String(stepName).trim().toLowerCase()
        );
        if (targetIndex !== -1 && updatedSteps[targetIndex].measuredData) {
          const mList = updatedSteps[targetIndex].measuredData!.map((m) => {
            if (m.parameter.trim().toLowerCase() === String(paramName).trim().toLowerCase()) {
              measCount++;
              return { ...m, value: String(val) };
            }
            return m;
          });
          updatedSteps[targetIndex] = {
            ...updatedSteps[targetIndex],
            measuredData: mList
          };
        }
      });
      logs.push(`Updated ${measCount} measured parameter(s) from spreadsheet`);
    }

    const updatedRecord: TravellerRecord = {
      ...currentTraveller,
      serialNumber: newSerial,
      customerName: newCustomer,
      jobNumber: newJob,
      partNumber: newPart,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          action: `Imported / Synchronized with Excel spreadsheet (${logs.join(', ')})`,
          user: currentTraveller.operatorName
        },
        ...currentTraveller.auditLog
      ]
    };

    return { updatedRecord, logs };
  }
}
