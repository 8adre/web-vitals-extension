/*
 Copyright 2020 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

(async () => {
  const src = chrome.runtime.getURL('src/browser_action/web-vitals.js');
  const webVitals = await import(src);

  // Registry for badge metrics
  badgeMetrics = {
    lcp: {
      value: 0,
      final: false,
      pass: true,
    },
    cls: {
      value: 0,
      final: false,
      pass: true,
    },
    fid: {
      value: 0,
      final: false,
      pass: true,
    },
  };

 /**
    * Very simple classifier for metrics values
    * @param  {Object} metrics
    * @return {Boolean} overall metrics pass/fail
  */
  function scoreBadgeMetrics(metrics) {
      let passingOverall = true;
      if (metrics.lcp.value > 2500) {
        passingOverall = false;
        metrics.lcp.pass = false;
      }
      if (metrics.fid.value > 100) {
        passingOverall = false;
        metrics.fid.pass = false;
      }
      if (metrics.fid.final === false) {
        passingOverall = false;
        metrics.fid.pass = false;
      }
      if (metrics.cls.value > 0.1) {
        passingOverall = false;
        metrics.cls.pass = false;
      }
      return passingOverall;
  }

  /**
     *
     * Draw or update the HUD overlay to the page
     * @param {Object} metrics
     */
  function drawOverlay(metrics) {
    // Check for preferences set in options
    chrome.storage.sync.get({
      enableOverlay: false,
    }, ({
      enableOverlay,
    }) => {
      if (enableOverlay === true) {
        const overlayElement = document.getElementById('web-vitals-extension');
        if (overlayElement === null) {
          const overlay = document.createElement('div');
          overlay.id = 'web-vitals-extension';
          overlay.innerHTML = buildOverlayTemplate(metrics);
          document.body.appendChild(overlay);
        } else {
          overlayElement.innerHTML = buildOverlayTemplate(metrics);
        }
      }
    });
  }


  /**
     *
     * Broadcasts metrics updates using chrome.runtime(), triggering
     * updates to the badge. Will also update the overlay if this option
     * is enabled.
     * @param {Object} body
     */
  function broadcastMetricsUpdates(metricName, body) {
    //if (metricName !== '') {
        badgeMetrics[metricName].value = body.value;
        badgeMetrics[metricName].final = body.isFinal;
        let passes = scoreBadgeMetrics(badgeMetrics);
    
        // Broadcast metrics updates for badging
        chrome.runtime.sendMessage({
          passesAllThresholds: passes,
          metrics: badgeMetrics,
        });
        // TODO: Once the metrics are final, cache locally.
        drawOverlay(badgeMetrics);
    //}
  }

  /**
 *
 * Fetches Web Vitals metrics via WebVitals.js
 */
  function fetchWebPerfMetrics() {
    webVitals.getCLS((metric) => {
        broadcastMetricsUpdates('cls', metric)
    }, true);
    webVitals.getLCP((metric) => {
        broadcastMetricsUpdates('lcp', metric)
    }, true);
    webVitals.getFID((metric) => {
        broadcastMetricsUpdates('fid', metric)
    }, true);
  }

  /**
 * Build a template of metrics
 * @param {Object} metrics The metrics
 * @return {String} a populated template of metrics
 */
  function buildOverlayTemplate(metrics) {
    return `
    <div id="lh-overlay-container" class="lh-unset lh-root lh-vars dark">
    <div class="lh-overlay">
    <div class="lh-audit-group lh-audit-group--metrics">
    <div class="lh-audit-group__header">
    <span class="lh-audit-group__title">Metrics</span></div>
    <div class="lh-columns">
      <div class="lh-column">
        <div class="lh-metric lh-metric--${metrics.lcp.pass ? 'pass':'fail'}">
          <div class="lh-metric__innerwrap">
            <span class="lh-metric__title">
              Largest Contentful Paint 
                <span class="lh-metric-state">${metrics.lcp.final ? '(final)' : '(not final)'}</span></span>
            <div class="lh-metric__value">${(metrics.lcp.value/1000).toFixed(2)}&nbsp;s</div>
          </div>
        </div>
        <div class="lh-metric lh-metric--${metrics.fid.pass ? 'pass':'fail'}">
          <div class="lh-metric__innerwrap">
            <span class="lh-metric__title">
              First Input Delay 
                <span class="lh-metric-state">${metrics.fid.final ? '(final)' : '(not final)'}</span></span>
            <div class="lh-metric__value">${metrics.fid.value.toFixed(2)}&nbsp;ms</div>
          </div>
        </div>
        <div class="lh-metric lh-metric--${metrics.cls.pass ? 'pass':'fail'}">
          <div class="lh-metric__innerwrap">
            <span class="lh-metric__title">
              Cumulative Layout Shift 
                <span class="lh-metric-state">${metrics.cls.final ? '(final)' : '(not final)'}</span></span>
            <div class="lh-metric__value">${metrics.cls.value.toFixed(3)}&nbsp;</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
  </div>`;
  }

  fetchWebPerfMetrics();
})();
