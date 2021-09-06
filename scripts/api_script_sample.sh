# Fetch all users from admin API:
SERVER_URL=https://pairwise-production-server-ous2w5vwba-uc.a.run.app ADMIN_TOKEN<token> SCRIPT_ACTION=GET_USERS node scripts/admin_script.js

# Fetch a user by email from admin API:
SERVER_URL=https://pairwise-production-server-ous2w5vwba-uc.a.run.app ADMIN_TOKEN<token> SCRIPT_ACTION=GET_USER USER_EMAIL=sean.smith.2009@gmail.com node scripts/admin_script.js

# Localhost
SERVER_URL=http://localhost:9000 ADMIN_TOKEN=test_token SCRIPT_ACTION=GET_USERS node scripts/admin_script.js

# Purchase the course for someone:
USER_EMAIL=sean.smith.2009@gmail.com COURSE_ID=fpvPtfu7s SCRIPT_ACTION=PURCHASE SERVER_URL=https://pairwise-production-server-ous2w5vwba-uc.a.run.app ADMIN_TOKEN<token> node scripts/admin_script.js

# Delate a user by email:
USER_EMAIL=sean@pairwise.tech SCRIPT_ACTION=DELETE_USER_BY_EMAIL SERVER_URL=https://pairwise-production-server-ous2w5vwba-uc.a.run.app ADMIN_TOKEN=a56sdasdf6a57sdf8as3d2sa4d145asf67dasf587a6s5df87a57f6sdaf8f5s687af578as5fisa86f6ds587f6as4f567sda456af2635s4d756df8sa75fRsTSDGSDFGSGSDHDTHSDFsifgupofdgpdspugpu7d6sf798g60783dfg8970spu2oi43jawegr8s7d09g87a8ewuproiajsjlsjflseutrouesyotysrgs node scripts/admin_script.js
