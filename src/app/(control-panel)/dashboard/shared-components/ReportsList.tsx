import { Avatar, Box, Grid, Typography } from '@mui/material'
import React from 'react'
import { ImageWrapperStyles, ImgStyles, ReportImgHeading, formatNumber } from "./common"


const ReportsList = ({ values, reports }) => {
    return (
        <Box my={4}>
            <Grid container spacing={2} justifyContent={"space-between"}>
                {values?.platforms?.name !== "TikTok" && <Grid item xs={12} sm={5} md={4} lg={2} sx={ImageWrapperStyles}>
                    <Avatar src="./assets/images/reporting/spendIcon.png" alt="phone" sx={{ ...ImgStyles, ...{ "& img": { height: "60%", width: "50%", objectFit: "contain" } } }} />
                    <Typography sx={ReportImgHeading}>
                        ${formatNumber(reports?.spend)}
                    </Typography>
                    <Typography fontSize="1.2rem">
                        Spend
                    </Typography>
                </Grid>}

                <Grid item xs={12} sm={5} md={4} lg={2} sx={ImageWrapperStyles}>
                    <Avatar src="./assets/images/reporting/GlobeIcon.png" alt="phone" sx={ImgStyles} />
                    <Typography sx={ReportImgHeading}>
                        {formatNumber(reports?.impressions)}
                    </Typography>
                    {/* <CountingTypography targetNumber={reports?.impressions} /> */}
                    <Typography fontSize="1.2rem">
                        Impressions
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={5} md={4} lg={2} sx={ImageWrapperStyles}>

                    <Avatar src="./assets/images/reporting/phoneIcon1.png" alt="phone" sx={{ ...ImgStyles, "& img": { height: "50%", objectFit: "contain" } }} />
                    {/* <CountingTypography targetNumber={46723} /> */}
                    <Typography sx={ReportImgHeading}>
                        {formatNumber(reports?.sessions)}
                    </Typography>
                    <Typography fontSize="1.2rem">
                        Views
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={5} md={4} lg={2} sx={{
                    ...ImageWrapperStyles,
                    minWidth: { xs: "auto", lg: 190 },
                    maxWidth: { xs: "auto !important", lg: "190px !important" },
                }}>
                    <Avatar src="./assets/images/reporting/CrossIcon.png" alt="phone" sx={{ ...ImgStyles, ...{ "& img": { height: "70%", objectFit: "contain" } } }} />
                    {/* <CountingTypography targetNumber={reports?.pofs}/>  */}
                    <Typography sx={ReportImgHeading}>
                        {formatNumber(reports?.pofs)}
                    </Typography>
                    <Typography fontSize="1.2rem">
                        Professions of Faith
                    </Typography>
                </Grid>
                {values?.platforms?.name !== "TikTok" && <Grid item xs={12} sm={5} md={4} lg={2} sx={ImageWrapperStyles}>
                    <Avatar src="./assets/images/reporting/cpofIcon.png" alt="Pray" sx={{ ...ImgStyles, "& img": { height: "50%", objectFit: "contain" } }} />
                    <Typography sx={ReportImgHeading}>
                        ${Number(reports?.cppof)?.toFixed(2)}
                    </Typography>
                    <Typography fontSize="1.2rem">
                        Cost per POF
                    </Typography>
                </Grid>}
            </Grid>
        </Box>
    )
}

export default ReportsList
