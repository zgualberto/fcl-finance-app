<template>
  <q-card class="rounded-borders q-pa-lg">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold q-mb-md">Terms and Conditions</div>
      <div class="text-subtitle2 text-grey-7">FCL Finance System</div>
    </div>

    <q-scroll-area style="height: 700px" class="bg-grey-1 q-pa-md rounded-borders q-mb-lg">
      <div class="terms-content">
        <!-- License Section -->
        <section class="q-mb-lg">
          <h3 class="text-h6 text-weight-bold q-mb-md">1. License</h3>
          <p class="q-my-sm">
            This application is licensed under the <strong>MIT License</strong>. Below is the full
            text of the license:
          </p>
          <q-card flat bordered class="bg-grey-2 q-pa-md q-my-md">
            <div class="text-caption mit-license">
              <p class="q-my-sm">
                <strong>MIT License</strong>
              </p>
              <p class="q-my-sm">Copyright (c) 2026 First Chapel Of Love</p>
              <p class="q-my-sm">
                Permission is hereby granted, free of charge, to any person obtaining a copy of this
                software and associated documentation files (the "Software"), to deal in the
                Software without restriction, including without limitation the rights to use, copy,
                modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
                and to permit persons to whom the Software is furnished to do so, subject to the
                following conditions:
              </p>
              <p class="q-my-sm">
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
              </p>
              <p class="q-my-sm">
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
                HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
                CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
                OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              </p>
            </div>
          </q-card>
        </section>

        <!-- Scope Section -->
        <section class="q-mb-lg">
          <h3 class="text-h6 text-weight-bold q-mb-md">2. Scope of the Application</h3>
          <p class="q-my-sm">
            The FCL Finance System is a specialized financial management application designed
            specifically for the administrative needs of First Chapel Of Love. The application
            provides the following core functionalities:
          </p>
          <ul class="q-my-md q-pl-lg">
            <li class="q-mb-sm">Track weekly collections from members</li>
            <li class="q-mb-sm">Record and categorize expenses</li>
            <li class="q-mb-sm">Generate monthly and annual financial reports</li>
            <li class="q-mb-sm">Manage member information and activity logs</li>
            <li class="q-mb-sm">Calculate deductions (National and District contributions)</li>
            <li class="q-mb-sm">Maintain backup and recovery of financial data</li>
            <li class="q-mb-sm">Provide configurable system settings</li>
          </ul>
          <p class="q-my-sm">
            This application is intended for internal use by First Chapel Of Love administrative
            staff only.
          </p>
        </section>

        <!-- Limitations Section -->
        <section class="q-mb-lg">
          <h3 class="text-h6 text-weight-bold q-mb-md">3. Limitations and Disclaimers</h3>

          <div class="q-mb-md">
            <h4 class="text-subtitle2 text-weight-bold q-mb-sm">3.1 Accuracy and Completeness</h4>
            <p class="q-my-sm">
              While the application is designed to maintain accurate financial records, users are
              responsible for the accuracy and completeness of data entered into the system. The
              developers assume no liability for errors in data entry or calculations arising from
              incorrect input data.
            </p>
          </div>

          <div class="q-mb-md">
            <h4 class="text-subtitle2 text-weight-bold q-mb-sm">3.2 Data Security</h4>
            <p class="q-my-sm">
              This application operates locally on mobile devices using SQLite databases. While
              reasonable security measures are implemented, users are responsible for:
            </p>
            <ul class="q-pl-lg">
              <li class="q-mb-sm">Protecting device access with appropriate authentication</li>
              <li class="q-mb-sm">Regularly backing up critical financial data</li>
              <li class="q-mb-sm">Ensuring physical device security</li>
              <li class="q-mb-sm">Keeping the application updated with the latest version</li>
            </ul>
          </div>

          <div class="q-mb-md">
            <h4 class="text-subtitle2 text-weight-bold q-mb-sm">3.3 No Liability for Data Loss</h4>
            <p class="q-my-sm">
              The developers and First Chapel Of Love are not liable for any data loss, corruption,
              or unavailability resulting from device failure, software bugs, or user actions. Users
              are advised to maintain regular backups of all financial data.
            </p>
          </div>

          <div class="q-mb-md">
            <h4 class="text-subtitle2 text-weight-bold q-mb-sm">3.4 Limited Warranty</h4>
            <p class="q-my-sm">
              This application is provided on an "AS IS" basis. The developers make no warranties,
              expressed or implied, regarding the fitness of the application for any particular
              purpose or its performance.
            </p>
          </div>

          <div class="q-mb-md">
            <h4 class="text-subtitle2 text-weight-bold q-mb-sm">
              3.5 No Professional Accounting Advice
            </h4>
            <p class="q-my-sm">
              This application is a record-keeping tool only and does not constitute professional
              accounting advice, tax guidance, or financial consulting. For such matters, please
              consult with qualified professionals.
            </p>
          </div>

          <div class="q-mb-md">
            <h4 class="text-subtitle2 text-weight-bold q-mb-sm">3.6 Scope Limitations</h4>
            <p class="q-my-sm">The application is limited to the following and does not provide:</p>
            <ul class="q-pl-lg">
              <li class="q-mb-sm">Cloud-based synchronization across multiple devices</li>
              <li class="q-mb-sm">Multi-user access control with granular permissions</li>
              <li class="q-mb-sm">Real-time collaboration features</li>
              <li class="q-mb-sm">Integration with external banking or accounting systems</li>
              <li class="q-mb-sm">
                Compliance with international accounting standards (GAAP, IFRS)
              </li>
              <li class="q-mb-sm">Professional audit trail features</li>
            </ul>
          </div>
        </section>

        <!-- Developer Information -->
        <section class="q-mb-lg">
          <h3 class="text-h6 text-weight-bold q-mb-md">
            4. Developer and Organization Information
          </h3>
          <p class="q-my-sm"><strong>Application Name:</strong> FCL Finance System</p>
          <p class="q-my-sm"><strong>Developed by:</strong> First Chapel Of Love</p>
          <p class="q-my-sm">
            <strong>Organization Address:</strong>
            <br />
            27 Araceli Street
            <br />
            Novaliches, Quezon City
            <br />
            Metro Manila, Philippines 1117
          </p>
          <p class="q-my-sm"><strong>License:</strong> MIT License</p>
          <p class="q-my-sm"><strong>Version:</strong> 1.1.0</p>
          <p class="q-my-sm"><strong>Last Updated:</strong> March 2026</p>
        </section>

        <!-- User Responsibilities -->
        <section class="q-mb-lg">
          <h3 class="text-h6 text-weight-bold q-mb-md">5. User Responsibilities</h3>
          <p class="q-my-sm">By using this application, you agree to:</p>
          <ul class="q-pl-lg">
            <li class="q-mb-sm">
              Use the application responsibly and in accordance with its intended purpose
            </li>
            <li class="q-mb-sm">
              Maintain the confidentiality of financial data accessible through this application
            </li>
            <li class="q-mb-sm">
              Comply with all applicable laws and regulations in your jurisdiction
            </li>
            <li class="q-mb-sm">
              Report any discovered security vulnerabilities to First Chapel Of Love immediately
            </li>
          </ul>
        </section>

        <!-- Modification of Terms -->
        <section class="q-mb-lg">
          <h3 class="text-h6 text-weight-bold q-mb-md">6. Modification of Terms</h3>
          <p class="q-my-sm">
            First Chapel Of Love reserves the right to modify these Terms and Conditions at any
            time. Changes will be effective upon release of a new application version. Your
            continued use of the application constitutes acceptance of modified terms.
          </p>
        </section>

        <!-- Contact Information -->
        <section>
          <h3 class="text-h6 text-weight-bold q-mb-md">7. Contact Information</h3>
          <p class="q-my-sm">
            For questions or concerns regarding these Terms and Conditions or the application,
            please contact:
          </p>
          <p class="q-my-sm q-mt-md">
            <strong>First Chapel Of Love</strong>
            <br />
            27 Araceli Street
            <br />
            Novaliches, Quezon City
            <br />
            Metro Manila, Philippines 1117
          </p>
        </section>
      </div>
    </q-scroll-area>
  </q-card>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.terms-content {
  h3 {
    color: #1f2937;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }

  h4 {
    color: #4b5563;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: #374151;
    line-height: 1.6;
  }

  ul {
    color: #374151;

    li {
      line-height: 1.6;
    }
  }

  .mit-license {
    font-family: 'Courier New', monospace;
    color: #1f2937;
    line-height: 1.5;
  }
}
</style>
