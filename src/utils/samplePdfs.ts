import { PdfDocument } from '../types';
import { chunkPageText } from './chunking';

/**
 * Realistic multi-document test suite for immediate 1-click testing
 */
export function createSampleDocuments(): PdfDocument[] {
  const doc1Id = 'sample-doc-sla-2025';
  const doc1Name = 'Cloud_Enterprise_SLA_2025.pdf';
  const doc1Page1 = `ENTERPRISE CLOUD INFRASTRUCTURE SERVICE LEVEL AGREEMENT (SLA)
Document Revision: 4.2 | Effective Date: January 1, 2025

SECTION 1: SYSTEM AVAILABILITY & UPTIME COMMITMENT
The Cloud Provider guarantees a Monthly Uptime Percentage of not less than 99.95% ("Service Commitment") for all production Kubernetes clusters, object storage, and serverless compute runtimes during any billing cycle.
If the Provider fails to meet the Service Commitment, Customer shall be eligible for Service Credits calculated as follows:
- 99.0% to < 99.95%: 10% Service Credit applied against monthly recurring charge.
- 95.0% to < 99.0%: 25% Service Credit applied against monthly recurring charge.
- < 95.0%: 50% Service Credit applied against monthly recurring charge.

SECTION 2: SCHEDULED MAINTENANCE WINDOWS
All routine maintenance windows must occur between 02:00 UTC and 06:00 UTC on Sunday mornings. The Provider must give at least 14 calendar days prior written notice for standard maintenance, and emergency maintenance requires at least 4 hours advance notice whenever practically feasible.`;

  const doc1Page2 = `SECTION 3: DISASTER RECOVERY & DATA RETENTION OBJECTIVES
The infrastructure architecture mandates a Recovery Point Objective (RPO) of ≤ 5 minutes for all transactional databases, and a Recovery Time Objective (RTO) of ≤ 30 minutes for complete failover to secondary geographic regions.
Automated snapshot backups must be retained for a rolling period of 365 calendar days with WORM (Write Once Read Many) immutability enabled.

SECTION 4: TERMINATION & REMEDIES FOR CHRONIC DOWNTIME
Customer reserves the unconditional right to terminate this Agreement without penalty if Uptime falls below 98.0% in any two consecutive months, or below 95.0% in any single calendar month. Upon termination, Provider shall deliver complete data exports within 7 business days in open-standard formats (JSON/Parquet/CSV) at zero additional egress fee.`;

  const doc2Id = 'sample-doc-sec-audit';
  const doc2Name = 'Global_AI_Security_Compliance_Audit.pdf';
  const doc2Page1 = `ANNUAL SOC-2 TYPE II & ISO/IEC 42001 AI COMPLIANCE AUDIT
Auditing Body: Apex Cybersecurity Assurance Group | Target Year: 2025

EXECUTIVE SUMMARY & CERTIFICATION SCOPE
This audit evaluated the physical, cryptographic, and operational security controls governing the in-browser and edge artificial intelligence inference pipeline.
The evaluation verified full compliance with ISO/IEC 27001, ISO/IEC 42001 (Artificial Intelligence Management Systems), and SOC-2 Type II Trust Services Criteria for Security and Confidentiality.

CRITICAL FINDING 1: ZERO SERVER TRANSMISSION (OFFLINE PRIVACY)
The audit team confirmed that the Progressive Web App architecture performs 100% of PDF document parsing, text vectorization, and inference within client-side WebAssembly and WebGPU memory sandboxes.
No document content, vector embeddings, or chat queries are transmitted over network sockets. Memory wipe tests demonstrated that all active vectors in IndexedDB can be purged instantly by the user with zero residual disk storage.`;

  const doc2Page2 = `CRITICAL FINDING 2: CRYPTOGRAPHIC ATTESTATION & ACCESS CONTROLS
All cached model weights stored in browser Cache Storage are verified against SHA-256 integrity hashes prior to execution.
Sub-resource integrity headers are strictly enforced to prevent supply chain tampering.
Cross-Origin-Opener-Policy (COOP) is set to 'same-origin' and Cross-Origin-Embedder-Policy (COEP) is set to 'credentialless' to enable secure multi-threaded SharedArrayBuffer execution without Spectre vulnerability exposure.

MANDATORY RECOMMENDATIONS & REMEDIATION TIMELINE
- Action Item SEC-01: Quarterly re-indexing of security hashes must be completed by November 15, 2025.
- Action Item SEC-02: Edge device thermal throttle monitoring should be integrated into client telemetry dashboards before Q1 2026.`;

  const doc3Id = 'sample-doc-procure-contract';
  const doc3Name = 'Vendor_Software_Procurement_Contract.pdf';
  const doc3Page1 = `MASTER SOFTWARE PROCUREMENT & LICENSING AGREEMENT
Parties: Alpha Corp (Buyer) and OmniDoc Systems Inc. (Vendor)
Contract ID: AGR-2025-9988 | Execution Date: March 15, 2025

ARTICLE 1: LICENSE GRANT & DEPLOYMENT TOPOLOGY
Vendor grants Buyer a perpetual, worldwide, non-exclusive enterprise license to deploy the software across unlimited internal browser nodes.
Because the software executes completely client-side without recurring cloud backend compute expenses, Buyer shall incur zero per-token inference fees and zero monthly subscription surcharges after initial licensing payment.

ARTICLE 2: PAYMENT SCHEDULE & MILESTONES
- Initial Milestone (Deployment Acceptance): $120,000 USD due within 30 days of production delivery.
- Secondary Milestone (PWA Offline Verification): $60,000 USD due upon third-party verification that the app operates without an active internet connection.
- Annual Software Maintenance & Updates: $15,000 USD billed annually starting on the second anniversary.`;

  const doc3Page2 = `ARTICLE 3: GOVERNING LAW & DISPUTE RESOLUTION
This Agreement shall be governed by and construed under the laws of the State of Delaware, without giving effect to conflicts of law principles.
Any disputes arising out of or relating to this Contract shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) in New York, NY.

ARTICLE 4: INTELLECTUAL PROPERTY & DATA SOVEREIGNTY
Buyer retains 100% ownership and intellectual property rights over all PDF documents, extracted text chunks, embeddings, and synthesized responses processed by the software.
Vendor explicitly disclaims any ownership, license, or right of inspection over user-processed documents, in accordance with the Zero Server Transmission architecture validated in the SOC-2 audit.`;

  // Build chunks for each document
  const chunks1 = [
    ...chunkPageText(doc1Page1, 1, doc1Id, doc1Name, 0),
    ...chunkPageText(doc1Page2, 2, doc1Id, doc1Name, 1)
  ];

  const chunks2 = [
    ...chunkPageText(doc2Page1, 1, doc2Id, doc2Name, 0),
    ...chunkPageText(doc2Page2, 2, doc2Id, doc2Name, 1)
  ];

  const chunks3 = [
    ...chunkPageText(doc3Page1, 1, doc3Id, doc3Name, 0),
    ...chunkPageText(doc3Page2, 2, doc3Id, doc3Name, 1)
  ];

  return [
    {
      id: doc1Id,
      fileName: doc1Name,
      fileSize: 184520,
      pageCount: 2,
      chunks: chunks1,
      status: 'ready',
      active: true,
      addedAt: Date.now() - 3600000,
      isSample: true
    },
    {
      id: doc2Id,
      fileName: doc2Name,
      fileSize: 248910,
      pageCount: 2,
      chunks: chunks2,
      status: 'ready',
      active: true,
      addedAt: Date.now() - 2400000,
      isSample: true
    },
    {
      id: doc3Id,
      fileName: doc3Name,
      fileSize: 198440,
      pageCount: 2,
      chunks: chunks3,
      status: 'ready',
      active: true,
      addedAt: Date.now() - 1200000,
      isSample: true
    }
  ];
}
