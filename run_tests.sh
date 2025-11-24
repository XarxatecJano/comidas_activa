#!/bin/bash
npm test 2>&1 | tee test_results.txt
echo "Exit code: $?"
