#' 3D scatter plot on Rstudio viewer
#'
#' @export
#' @examples
#' qplot3(aes(x=x, y=y, z=z, color=pick), ret)
qplot3 <- function(mappings, data, verbose_level=0) {
  temp_dir <- tempdir()
  if (verbose_level > 1) message(sprintf('Creating directory %s', temp_dir))

  if (!file.exists(file.path(temp_dir, '3js'))) {
    plotter_dir <- system.file('3js', package='ggplot3')
    file.copy(plotter_dir, temp_dir, recursive=T)
    if (verbose_level > 1) message(sprintf('Copy %s to %s', plotter_dir, temp_dir))
  }

  json_string <- jsonlite::toJSON(list(data=data, mappings=lapply(mappings, as.character)), dataframe='columns', auto_unbox=T)

  write(json_string, file.path(temp_dir, '3js', 'query.json'));

  rstudioapi::viewer(paste0(file.path(temp_dir, '3js', 'index.html')))
}
