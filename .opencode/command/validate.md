---
description: Validate code quality and project health
agent: build
---

Validate the project by running all quality checks in sequence and fix any issues found:

1. Run `npm run lint` to check code style and catch potential issues
   - If warnings or errors are found, automatically fix them using available auto-fix options
   - For issues that can't be auto-fixed, make the necessary code changes manually

2. Run `npm run typecheck` to verify TypeScript type safety
   - Fix any TypeScript errors by adding proper types, imports, or correcting type mismatches
   - Never use `any` type - always provide proper TypeScript types

3. Run `npx expo-doctor` to check Expo project configuration and dependencies
   - Fix any configuration issues or dependency problems
   - Update or install missing dependencies as recommended

4. Run `npm run test:ci` to execute the full test suite
   - Fix any failing tests by correcting the code or updating test expectations
   - Ensure all tests pass before proceeding

For each step:
- Show the command output
- If warnings or errors are found, immediately fix them
- Re-run the command after fixes to verify the issues are resolved
- Only proceed to the next step once the current step passes with no warnings or errors

Continue this process until all validation steps pass completely. Provide a final summary confirming the project is fully validated and ready.